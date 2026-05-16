import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  bucketFotos: process.env.SUPABASE_STORAGE_BUCKET_FOTOS ?? 'vistorias-fotos',
  bucketAnexos: process.env.SUPABASE_STORAGE_BUCKET_ANEXOS ?? 'vistorias-anexos',
  bucketAssinaturas: process.env.SUPABASE_STORAGE_BUCKET_ASSINATURAS ?? 'vistorias-assinaturas',
}));
