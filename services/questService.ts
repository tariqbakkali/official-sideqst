import { supabase } from '@/lib/supabase';

export interface Quest {
  id: string;
  name: string;
  description: string;
  category_id: string;
  difficulty: number;
  uniqueness: number;
  location_type: 'anywhere' | 'online' | 'address';
  location_text: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  is_public: boolean;
  cost?: number;
  photo_url?: string;
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  is_completed?: boolean;
  completed_at?: string;
  completion_notes?: string;
  completion_photos?: string;
  is_completed?: boolean;
}

export interface CreateQuestData {
  name: string;
  description: string;
  category_id: string;
  difficulty: number;
  uniqueness: number;
  location_type: 'anywhere' | 'online' | 'address';
  location_text: string;
  latitude?: number;
  longitude?: number;
  cost?: number;
  photo_url?: string;
  duration_value: number;
  duration_unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  is_public?: boolean;
}

export interface NearbyQuestsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}

class QuestService {
  /**
   * Create a new sidequest
   */
  async createQuest(questData: CreateQuestData) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      console.log('Creating quest with data:', questData);
      console.log('User ID:', user.id);

      const { data, error } = await supabase
        .from('sidequests')
        .insert([{
          ...questData,
          created_by: user.id,
          is_public: questData.is_public ?? true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Quest created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createQuest:', error);
      throw error;
    }
  }

  /**
   * Get quests near a specific location
   */
  async getNearbyQuests({ 
    latitude, 
    longitude, 
    radiusKm = 10, 
    limit = 20 
  }: NearbyQuestsParams): Promise<Quest[]> {
    // Using the Haversine formula to calculate distance
    const { data, error } = await supabase
      .rpc('get_nearby_quests', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
        quest_limit: limit,
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all public quests
   */
  async getPublicQuests(limit: number = 50): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('sidequests')
      .select(`
        *,
        quest_categories (
          name,
          icon,
          color
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's own quests
   */
  async getUserQuests(): Promise<Quest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sidequests')
      .select(`
        *,
        quest_categories (
          name,
          icon,
          color
        )
      `)
      .eq('created_by', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a quest
   */
  async updateQuest(questId: string, updates: Partial<CreateQuestData>) {
    const { data, error } = await supabase
      .from('sidequests')
      .update(updates)
      .eq('id', questId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a quest
   */
  async deleteQuest(questId: string) {
    const { error } = await supabase
      .from('sidequests')
      .delete()
      .eq('id', questId);

    if (error) throw error;
  }

  /**
   * Add a quest to user's active quests (copy to their account)
   */
  async addToMyQuests(questId: string): Promise<Quest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the original quest
    const { data: originalQuest, error: fetchError } = await supabase
      .from('sidequests')
      .select('*')
      .eq('id', questId)
      .single();

    if (fetchError) throw fetchError;
    if (!originalQuest) throw new Error('Quest not found');

    // Create a copy for the user
    const { data: newQuest, error: createError } = await supabase
      .from('sidequests')
      .insert([{
        name: originalQuest.name,
        description: originalQuest.description,
        category_id: originalQuest.category_id,
        difficulty: originalQuest.difficulty,
        uniqueness: originalQuest.uniqueness,
        location_type: originalQuest.location_type,
        location_text: originalQuest.location_text,
        latitude: originalQuest.latitude,
        longitude: originalQuest.longitude,
        cost: originalQuest.cost,
        photo_url: originalQuest.photo_url,
        duration_value: originalQuest.duration_value,
        duration_unit: originalQuest.duration_unit,
        created_by: user.id,
        is_public: false, // User's personal copy is private by default
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newQuest;
  }

  /**
   * Check if user has already added a quest to their active quests
   */
  async hasAddedToMyQuests(originalQuestId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get the original quest details to match against
    const { data: originalQuest, error: fetchError } = await supabase
      .from('sidequests')
      .select('name, description')
      .eq('id', originalQuestId)
      .single();

    if (fetchError) return false;

    // Check if user has a quest with the same name and description
    const { data, error } = await supabase
      .from('sidequests')
      .select('id')
      .eq('created_by', user.id)
      .eq('name', originalQuest.name)
      .eq('description', originalQuest.description)
      .limit(1);

    if (error) return false;
    return (data && data.length > 0);
  }

  /**
   * Complete a quest with notes and optional photo
   */
  async completeQuest(
    questId: string, 
    completionNotes: string, 
    completionPhotoUrl?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('sidequests')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes,
        completion_photo_url: completionPhotoUrl,
      })
      .eq('id', questId)
      .eq('created_by', user.id);

    if (error) throw error;
  }

  /**
   * Get user's completed quests for journal
   */
  async getCompletedQuests(): Promise<Quest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('sidequests')
      .select(`
        *,
        quest_categories (
          name,
          icon,
          color
        )
      `)
      .eq('created_by', user.id)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const questService = new QuestService();