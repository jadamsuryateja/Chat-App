import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserContextType {
  userId: string;
  username: string;
  setUsername: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>('');
  const [username, setUsernameState] = useState<string>('');

  useEffect(() => {
    let storedUserId = localStorage.getItem('chat_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', storedUserId);
    }
    setUserId(storedUserId);

    const storedUsername = localStorage.getItem('chat_username');
    if (storedUsername) {
      setUsernameState(storedUsername);
    }
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    localStorage.setItem('chat_username', name);
  };

  return (
    <UserContext.Provider value={{ userId, username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
