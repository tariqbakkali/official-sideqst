import { supabase } from '@/lib/supabase';

class StorageService {
  /**
   * Upload a photo to Supabase Storage
   * @param uri - Local file URI from ImagePicker
   * @param bucket - Storage bucket name
   * @param folder - Folder path within the bucket
   * @returns Public URL of the uploaded file
   */
  async uploadPhoto(
    uri: string,
    bucket: string = 'quest-photos',
    folder?: string
  ): Promise<string> {
    try {
      console.log('[StorageService] Starting upload for:', uri);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('[StorageService] Auth error:', userError);
        throw new Error('User not authenticated');
      }

      console.log('[StorageService] User authenticated:', user.id);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = folder ? `${folder}/${fileName}` : `${user.id}/${fileName}`;

      console.log('[StorageService] File path:', filePath);

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[StorageService] Blob created, size:', blob.size, 'type:', blob.type);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('[StorageService] Upload error:', error);
        throw error;
      }

      console.log('[StorageService] Upload successful:', data);

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('[StorageService] Public URL:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('[StorageService] Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Delete a photo from Supabase Storage
   * @param url - Public URL of the file to delete
   * @param bucket - Storage bucket name
   */
  async deletePhoto(url: string, bucket: string = 'quest-photos'): Promise<void> {
    try {
      const path = url.split(`${bucket}/`)[1];
      if (!path) throw new Error('Invalid photo URL');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
