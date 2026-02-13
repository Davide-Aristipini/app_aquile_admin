import { Injectable } from '@angular/core';

import { supabase } from './supabase-client';

export const MAX_STORAGE_BYTES = 1024 * 1024 * 1024;

@Injectable({ providedIn: 'root' })
export class StorageService {
  async fetchStorageUsage(): Promise<number> {
    if (!supabase) return 0;

    const { data, error } = await supabase.from('media_assets').select('size_bytes');

    if (error) {
      throw error;
    }

    return (data ?? []).reduce((acc, item) => acc + (item.size_bytes || 0), 0);
  }

  async uploadWithLimit({
    file,
    bucket,
    path,
    maxBytes = MAX_STORAGE_BYTES,
  }: {
    file: File;
    bucket: string;
    path: string;
    maxBytes?: number;
  }): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase non configurato.');
    }

    const currentUsage = await this.fetchStorageUsage();
    const nextUsage = currentUsage + file.size;

    if (nextUsage > maxBytes) {
      const error = new Error('Spazio insufficiente: superi il limite di 1GB.');
      (error as Error & { code?: string }).code = 'LIMIT_EXCEEDED';
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

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl.publicUrl;
  }
}
