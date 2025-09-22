import { supabase } from '@/lib/supabase';

export interface WishlistItem {
  id: string;
  user_id: string;
  quest_id: string;
  created_at: string;
  sidequests?: {
    id: string;
    name: string;
    description: string;
    photo_url?: string;
    quest_categories?: {
      name: string;
      icon: string;
      color: string;
    };
  };
}

class WishlistService {
  /**
   * Add a quest to user's wishlist
   */
  async addToWishlist(questId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_wishlist')
      .insert([{
        user_id: user.id,
        quest_id: questId,
      }]);

    if (error) throw error;
  }

  /**
   * Remove a quest from user's wishlist
   */
  async removeFromWishlist(questId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('quest_id', questId);

    if (error) throw error;
  }

  /**
   * Check if a quest is in user's wishlist
   */
  async isInWishlist(questId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('quest_id', questId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  /**
   * Get user's wishlist with quest details
   */
  async getUserWishlist(): Promise<WishlistItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_wishlist')
      .select(`
        *,
        sidequests (
          id,
          name,
          description,
          photo_url,
          difficulty,
          uniqueness,
          location_type,
          location_text,
          duration_value,
          duration_unit,
          quest_categories (
            name,
            icon,
            color
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get wishlist count for user
   */
  async getWishlistCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('user_wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;
    return count || 0;
  }
}

export const wishlistService = new WishlistService();