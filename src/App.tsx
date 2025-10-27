import { useState, useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import CreateRoomModal from './components/CreateRoomModal';
import JoinRoomModal from './components/JoinRoomModal';
import { supabase } from './lib/supabase';
import { initNotificationService, requestNotificationPermission, getNotificationPermission } from './services/notificationService';

type View = 'list' | 'chat';

function AppContent() {
  const [view, setView] = useState<View>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notificationPromptShown, setNotificationPromptShown] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
      setShowJoinModal(true);
    }
  }, []);

  useEffect(() => {
    if (view === 'list' && !notificationPromptShown) {
      const permission = getNotificationPermission();
      if (permission === 'default') {
        setTimeout(async () => {
          const granted = await requestNotificationPermission();
          if (granted) {
            console.log('Notifications enabled');
          }
          setNotificationPromptShown(true);
        }, 2000);
      }
    }
  }, [view, notificationPromptShown]);

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

export default function App() {
  useEffect(() => {
    initNotificationService();
  }, []);

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
