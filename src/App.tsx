import { useState, useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { UserProvider } from './context/UserContext';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import CreateRoomModal from './components/CreateRoomModal';
import JoinRoomModal from './components/JoinRoomModal';
import { supabase } from './lib/supabase';

type View = 'list' | 'chat';

function AppContent() {
  const [view, setView] = useState<View>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load room state from URL on initial render
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
      loadRoomInfo(roomId);
    }
  }, []);

  // Update URL when room changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedRoomId) {
      url.searchParams.set('room', selectedRoomId);
    } else {
      url.searchParams.delete('room');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedRoomId]);

  const loadRoomInfo = async (roomId: string) => {
    try {
      const { data } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', roomId)
        .single();

      if (data) {
        setSelectedRoomId(roomId);
        setSelectedRoomName(data.name);
        setView('chat');
      }
    } catch (error) {
      console.error('Error loading room info:', error);
    }
  };

  const handleSelectRoom = async (roomId: string) => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('name')
      .eq('id', roomId)
      .single();

    if (data) {
      setSelectedRoomId(roomId);
      setSelectedRoomName(data.name);
      setView('chat');
    }
  };

  const handleBack = () => {
    setView('list');
    setSelectedRoomId('');
    setSelectedRoomName('');
    setRefreshKey(prev => prev + 1);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      {view === 'list' ? (
        <RoomList
          key={refreshKey}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={() => setShowCreateModal(true)}
          onJoinRoom={() => setShowJoinModal(true)}
        />
      ) : (
        <ChatRoom
          roomId={selectedRoomId}
          roomName={selectedRoomName}
          onBack={handleBack}
        />
      )}

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}

async function hideStatusBar() {
  try {
    await StatusBar.hide();
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch (err) {
    console.log('Status bar API not available');
  }
}

export default function App() {
  useEffect(() => {
    hideStatusBar();
    // Add fullscreen mode
    document.documentElement.requestFullscreen?.();
  }, []);

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
