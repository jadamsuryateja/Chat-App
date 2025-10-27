import { useEffect, useState } from 'react';
import { Plus, MessageCircle, Users, Lock, Linkedin, Github, Instagram } from 'lucide-react';
import { getUserRooms } from '../services/chatService';
import { useUser } from '../context/UserContext';
import { ChatRoom } from '../lib/supabase';

interface RoomListProps {
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  initialRooms?: (ChatRoom & { memberCount: number })[];
}

export default function RoomList({ 
  onSelectRoom, 
  onCreateRoom, 
  onJoinRoom,
  initialRooms = [] 
}: RoomListProps) {
  const { userId } = useUser();
  const [rooms, setRooms] = useState<(ChatRoom & { memberCount: number })[]>(initialRooms);
  const [loading, setLoading] = useState(!initialRooms.length);

  useEffect(() => {
    // Only fetch if we don't have initial rooms or if userId changes
    if (userId && (!initialRooms.length || rooms !== initialRooms)) {
      loadRooms();
    }
  }, [userId, initialRooms]);

  const loadRooms = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getUserRooms(userId);
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-render skeleton loading state
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => (
        <div 
          key={index}
          className="w-full glass-panel p-5 rounded-2xl animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-gray-800"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-800 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="safe-top p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl border border-gray-700 mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Chat Rooms
              </h1>
              <p className="text-gray-400 text-sm md:text-base">Your secure conversations</p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={onCreateRoom}
                className="flex-1 glass-panel p-4 rounded-2xl hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Create Room</span>
                </div>
              </button>
              <button
                onClick={onJoinRoom}
                className="flex-1 glass-panel p-4 rounded-2xl hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Join Room</span>
                </div>
              </button>
            </div>

            {loading ? (
              renderSkeleton()
            ) : rooms.length === 0 ? (
              <div className="glass-panel p-12 rounded-3xl text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-300">No rooms yet</h3>
                <p className="text-gray-500 mb-6">Create or join a room to start chatting</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room, index) => (
                  <button
                    key={room.id}
                    onClick={() => onSelectRoom(room.id)}
                    className="w-full glass-panel p-5 rounded-2xl hover:scale-[1.02] transition-all duration-300 text-left group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fade-in 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">{room.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-500 group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-gray-800 safe-bottom p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <a
                href="https://www.linkedin.com/in/jadamsurya"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-300"
              >
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://github.com/jadamsuryateja"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-300"
              >
                <Github className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://www.instagram.com/_s_u_r_y_a_.j_/
"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-300"
              >
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
            </div>
            <div className="text-center text-sm text-gray-400">
              <p className="mb-1">Developed by</p>
              <p className="font-medium">JADAM SURYA TEJA & KRUPA CHAITANYA YELL</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add this function to pre-fetch rooms
export async function preloadRooms(userId: string) {
  try {
    return await getUserRooms(userId);
  } catch (error) {
    console.error('Error preloading rooms:', error);
    return [];
  }
}