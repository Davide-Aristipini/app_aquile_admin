import { supabase } from './supabase.js';

export const MAX_STORAGE_BYTES = 1024 * 1024 * 1024;

export async function fetchStorageUsage() {
  const { data, error } = await supabase
    .from('media_assets')
    .select('size_bytes');

  if (error) {
    throw error;
  }

  return data.reduce((acc, item) => acc + (item.size_bytes || 0), 0);
}

export async function uploadWithLimit({
  file,
  bucket,
  path,
  maxBytes = MAX_STORAGE_BYTES,
}) {
  const currentUsage = await fetchStorageUsage();
  const nextUsage = currentUsage + file.size;
  if (nextUsage > maxBytes) {
    const error = new Error(
      'Spazio insufficiente: superi il limite di 1GB.'
    );
    error.code = 'LIMIT_EXCEEDED';
    throw error;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });

  if (error) {
    throw error;
  }

  await supabase.from('media_assets').insert({
    path: data.path,
    bucket,
    size_bytes: file.size,
    mime_type: file.type,
  });

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}
