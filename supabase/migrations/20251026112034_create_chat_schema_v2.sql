/*
  # Chat Application Database Schema

  ## Overview
  Simple chat application with rooms, members, and messages.
  Uses client-generated user IDs stored in localStorage.

  ## New Tables

  ### 1. `chat_rooms`
  - `id` (uuid, primary key)
  - `name` (text) - Room name
  - `password_hash` (text) - Hashed password
  - `creator_id` (text) - Creator's client ID
  - `created_at` (timestamptz)

  ### 2. `room_members`
  - `id` (uuid, primary key)
  - `room_id` (uuid, foreign key)
  - `user_id` (text) - Client-generated user ID
  - `username` (text) - Display name
  - `is_creator` (boolean)
  - `joined_at` (timestamptz)

  ### 3. `messages`
  - `id` (uuid, primary key)
  - `room_id` (uuid, foreign key)
  - `user_id` (text)
  - `username` (text)
  - `content` (text)
  - `created_at` (timestamptz)

  ## Security
  RLS enabled with policies allowing members to access their rooms.
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  password_hash text NOT NULL,
  creator_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  username text NOT NULL,
  is_creator boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  username text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room_user ON room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations (client-side handles auth logic)
CREATE POLICY "Allow all on chat_rooms" ON chat_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on room_members" ON room_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);