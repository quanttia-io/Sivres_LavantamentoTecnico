import { Injectable, ServiceUnavailableException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private _supabase: SupabaseClient | null = null;

  constructor(private config: ConfigService) {}

  private get supabase(): SupabaseClient {
    if (!this._supabase) {
      const url = this.config.get<string>('storage.supabaseUrl') ?? '';
      const key = this.config.get<string>('storage.supabaseServiceRoleKey') ?? '';

      if (!url || url.includes('[PROJECT_REF]')) {
        throw new ServiceUnavailableException(
          'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env',
        );
      }

      this._supabase = createClient(url, key);
    }
    return this._supabase;
  }

  async onModuleInit() {
    try {
      await this.ensureBuckets();
    } catch (err: any) {
      this.logger.warn(`Não foi possível verificar/criar buckets de storage: ${err?.message}`);
    }
  }

  private async ensureBuckets() {
    const buckets = [this.getBucketFotos(), this.getBucketAnexos(), this.getBucketAssinaturas()];
    for (const name of buckets) {
      const { error } = await this.supabase.storage.createBucket(name, { public: true });
      if (error && !error.message.toLowerCase().includes('already exists')) {
        this.logger.warn(`Bucket "${name}": ${error.message}`);
      } else if (!error) {
        this.logger.log(`Bucket "${name}" criado com sucesso`);
      }
    }
  }

  async upload(bucket: string, key: string, buffer: Buffer, mimeType: string): Promise<string> {
    let { error } = await this.supabase.storage.from(bucket).upload(key, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) {
      // Bucket might not exist yet — try to create it and retry once
      const msg = error.message.toLowerCase();
      if (msg.includes('bucket') || msg.includes('not found') || msg.includes('does not exist')) {
        this.logger.warn(`Bucket "${bucket}" não encontrado, tentando criar...`);
        await this.supabase.storage.createBucket(bucket, { public: true }).catch((e: any) => {
          this.logger.warn(`Falha ao criar bucket "${bucket}": ${e?.message}`);
        });
        const retry = await this.supabase.storage.from(bucket).upload(key, buffer, {
          contentType: mimeType,
          upsert: true,
        });
        error = retry.error;
      }
    }

    if (error) throw new Error(`Storage upload error (bucket "${bucket}"): ${error.message}`);

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(bucket: string, key: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([key]);
    if (error) throw new Error(`Storage delete error: ${error.message}`);
  }

  getBucketFotos(): string {
    return this.config.get<string>('storage.bucketFotos')!;
  }

  getBucketAnexos(): string {
    return this.config.get<string>('storage.bucketAnexos')!;
  }

  getBucketAssinaturas(): string {
    return this.config.get<string>('storage.bucketAssinaturas')!;
  }
}
