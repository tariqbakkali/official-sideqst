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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = folder ? `${folder}/${fileName}` : `${user.id}/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
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
