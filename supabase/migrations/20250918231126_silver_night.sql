/*
  # Create user_wishlist table

  1. New Tables
    - `user_wishlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `quest_id` (uuid, foreign key to sidequests)
      - `created_at` (timestamp)
      - Unique constraint on (user_id, quest_id)

  2. Security
    - Enable RLS on `user_wishlist` table
    - Add policies for users to manage their own wishlist items
*/

CREATE TABLE IF NOT EXISTS public.user_wishlist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  quest_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT user_wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_wishlist_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.sidequests(id) ON DELETE CASCADE,
  CONSTRAINT user_wishlist_user_id_quest_id_key UNIQUE (user_id, quest_id)
);

ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist items" ON public.user_wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON public.user_wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON public.user_wishlist
  FOR DELETE USING (auth.uid() = user_id);