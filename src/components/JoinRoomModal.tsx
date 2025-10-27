import { useState } from 'react';
import { X, Lock, Key } from 'lucide-react';
import { joinRoom } from '../services/chatService';
import { useUser } from '../context/UserContext';

interface JoinRoomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinRoomModal({ onClose, onSuccess }: JoinRoomModalProps) {
  const { userId, username, setUsername } = useUser();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!password) {
      setError('Please enter the room password');
      return;
    }

    try {
      setLoading(true);
      if (!username) {
        setUsername(displayName.trim());
      }
      await joinRoom(roomId.trim(), password, userId, displayName.trim());
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to join room. Please check the room ID and password.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-area-view fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold">Join Room</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass-panel hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!username && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-300"
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-300 font-mono text-sm"
              placeholder="Paste room ID here"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Get this from the person who created the room</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all duration-300"
                placeholder="Enter room password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="glass-panel bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 rounded-xl py-3 font-semibold transition-all duration-300 hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining...</span>
              </div>
            ) : (
              'Join Room'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
