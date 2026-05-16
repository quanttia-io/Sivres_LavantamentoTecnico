import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
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

  async upload(bucket: string, key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { error } = await this.supabase.storage.from(bucket).upload(key, buffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (error) throw new Error(`Storage upload error: ${error.message}`);

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
