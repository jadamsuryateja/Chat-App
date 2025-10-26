import { supabase, ChatRoom, RoomMember, Message } from '../lib/supabase';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createRoom(name: string, password: string, userId: string, username: string) {
  const passwordHash = await hashPassword(password);

  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({
      name,
      password_hash: passwordHash,
      creator_id: userId,
    })
    .select()
    .single();

  if (roomError) throw roomError;

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: room.id,
      user_id: userId,
      username,
      is_creator: true,
    });

  if (memberError) throw memberError;

  return room;
}

export async function joinRoom(roomId: string, password: string, userId: string, username: string) {
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError) throw new Error('Room not found');

  const passwordHash = await hashPassword(password);
  if (passwordHash !== room.password_hash) {
    throw new Error('Incorrect password');
  }

  const { data: existing } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return room;
  }

  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: roomId,
      user_id: userId,
      username,
      is_creator: false,
    });

  if (memberError) throw memberError;

  return room;
}

export async function getUserRooms(userId: string): Promise<(ChatRoom & { memberCount: number })[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);

  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return [];

  const roomIds = memberships.map(m => m.room_id);

  const { data: rooms, error: roomError } = await supabase
    .from('chat_rooms')
    .select('*')
    .in('id', roomIds)
    .order('created_at', { ascending: false });

  if (roomError) throw roomError;

  const roomsWithCounts = await Promise.all(
    (rooms || []).map(async (room) => {
      const { count } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      return {
        ...room,
        memberCount: count || 0,
      };
    })
  );

  return roomsWithCounts;
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMessages(roomId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function sendMessage(roomId: string, userId: string, username: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      username,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMessages(roomId: string, callback: (message: Message) => void) {
  const channel = supabase
    .channel(`messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function leaveRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
}
