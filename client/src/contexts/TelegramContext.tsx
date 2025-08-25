import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initTelegramApp, getTelegramUser, isTelegramWebApp } from '../lib/telegram';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  photoUrl?: string;
}

interface TelegramContextType {
  isTelegramApp: boolean;
  user: TelegramUser | null;
  isInitialized: boolean;
  initApp: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

interface TelegramProviderProps {
  children: ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initApp = () => {
    try {
      if (isTelegramWebApp()) {
        setIsTelegramApp(true);
        
        // Initialize Telegram Web App
        const webApp = initTelegramApp();
        
        // Get user data
        const telegramUser = getTelegramUser();
        if (telegramUser) {
          setUser(telegramUser);
        }
        
        setIsInitialized(true);
        
        console.log('Telegram Web App initialized successfully');
        console.log('User:', telegramUser);
        console.log('WebApp:', webApp);
      } else {
        console.log('Not running in Telegram Web App');
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize Telegram Web App:', error);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const value: TelegramContextType = {
    isTelegramApp,
    user,
    isInitialized,
    initApp,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};
