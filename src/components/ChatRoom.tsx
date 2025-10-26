import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Send, Users, Copy, Check } from 'lucide-react';
import { getMessages, sendMessage, subscribeToMessages, getRoomMembers } from '../services/chatService';
import { useUser } from '../context/UserContext';
import { Message, RoomMember } from '../lib/supabase';
import HapticService from '../services/HapticService';

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  onBack: () => void;
}

export default function ChatRoom({ roomId, roomName, onBack }: ChatRoomProps) {
  const { userId, username } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    loadMessages();
    loadMembers();

    // Set up real-time updates
    const messageInterval = setInterval(() => {
      loadMessages();
      loadMembers();
    }, 2000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [roomId, userId]);

  useEffect(() => {
    let isSubscribed = true;

    // Set up realtime subscription with haptic feedback
    const unsubscribe = subscribeToMessages(roomId, async (message) => {
      if (!isSubscribed) return;
      
      // Only trigger haptic feedback for received messages (not sent by current user)
      if (message.user_id !== userId) {
        try {
          await HapticService.doorKnock();
        } catch (error) {
          console.error('Haptic feedback failed:', error);
        }
      }
      
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [roomId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Optimize loadMessages to avoid duplicate messages
  const loadMessages = async () => {
    try {
      setLoading((prev) => (!prev ? prev : false)); // Only show loading on initial load
      const data = await getMessages(roomId);
      setMessages((prevMessages) => {
        // Only update if we have new messages
        if (data.length !== prevMessages.length) {
          return data;
        }
        // Check if last message is different
        if (data.length > 0 && prevMessages.length > 0) {
          const lastNew = data[data.length - 1];
          const lastCurrent = prevMessages[prevMessages.length - 1];
          if (lastNew.id !== lastCurrent.id) {
            return data;
          }
        }
        return prevMessages;
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Optimize loadMembers to avoid unnecessary re-renders
  const loadMembers = async () => {
    try {
      const data = await getRoomMembers(roomId);
      setMembers((prevMembers) => {
        // Only update if member count or composition changed
        if (data.length !== prevMembers.length) {
          return data;
        }
        const prevIds = new Set(prevMembers.map((m) => m.id));
        const hasChanges = data.some((member) => !prevIds.has(member.id));
        return hasChanges ? data : prevMembers;
      });
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !username) return;

    try {
      await sendMessage(roomId, userId, username, newMessage.trim());
      await HapticService.success(); // Haptic feedback on successful send
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      await HapticService.error(); // Haptic feedback on error
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Add safe-area padding to header */}
      <div className="glass-panel border-b border-gray-800 sticky top-0 z-10 chat-header">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl glass-panel hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg truncate">{roomName}</h2>
              <p className="text-xs text-gray-400 truncate">Room ID: {roomId.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomId}
              className="w-10 h-10 rounded-xl glass-panel hover:scale-110 transition-all duration-300 flex items-center justify-center"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="w-10 h-10 rounded-xl glass-panel hover:scale-110 transition-all duration-300 flex items-center justify-center relative"
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full text-xs flex items-center justify-center border border-gray-600">
                {members.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showMembers && (
        <div className="glass-panel border-b border-gray-800 p-4 animate-fade-in">
          <h3 className="font-semibold mb-3 text-sm text-gray-400">Members ({members.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1">{member.username}</span>
                {member.is_creator && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages section with safe-area padding */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 px-[max(1rem,env(safe-area-inset-left))]">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.user_id === userId;
            const showUsername = index === 0 || messages[index - 1].user_id !== message.user_id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[80%] md:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {showUsername && !isOwn && (
                    <span className="text-xs text-gray-400 px-2">{message.username}</span>
                  )}
                  <div
                    className={`glass-panel p-3 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-br-md'
                        : 'rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm md:text-base break-words">{message.content}</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer with safe-area padding */}
      <form onSubmit={handleSend} className="glass-panel border-t border-gray-800 sticky bottom-0 chat-footer">
        <div className="p-4 px-[max(1rem,env(safe-area-inset-left))]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-300"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
