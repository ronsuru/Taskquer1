import React, { createContext, useContext, useEffect, useState } from 'react';
import { initTelegramApp, getTelegramUser, getTelegramUserFallback, checkTelegramEnvironment } from '../lib/telegram';

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
  children: React.ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const initApp = async () => {
    try {
      console.log('🚀 Starting Telegram app initialization...');
      
      // Add visible debugging to the UI
      setDebugInfo('🚀 Starting Telegram app initialization...');
      
      // First, do a comprehensive environment check
      const isTelegramEnv = checkTelegramEnvironment();
      console.log('🔍 Environment check result:', isTelegramEnv);
      setDebugInfo(prev => prev + '\n🔍 Environment check result: ' + isTelegramEnv);
      
      if (!isTelegramEnv) {
        console.log('❌ Not in Telegram environment, using fallback user data');
        setDebugInfo(prev => prev + '\n❌ Not in Telegram environment, using fallback user data');
        const fallbackUser = getTelegramUserFallback();
        if (fallbackUser) {
          setUser(fallbackUser);
          setIsTelegramApp(false);
          setIsInitialized(true);
          console.log('✅ Fallback user data retrieved:', fallbackUser);
          setDebugInfo(prev => prev + '\n✅ Fallback user data retrieved: ' + JSON.stringify(fallbackUser, null, 2));
        } else {
          console.log('❌ No fallback user data available');
          setDebugInfo(prev => prev + '\n❌ No fallback user data available');
          setIsInitialized(true);
        }
        return;
      }
      
      // Set that we're in a Telegram environment
      setIsTelegramApp(true);
      
      // Initialize Telegram Web App
      const webApp = initTelegramApp();
      console.log('✅ Telegram Web App initialized:', webApp);
      setDebugInfo(prev => prev + '\n✅ Telegram Web App initialized');
      
      // Try to get user data with improved async method
      let userData = await getTelegramUser();
      if (!userData) {
        console.log('🔄 Primary method failed, trying fallback...');
        setDebugInfo(prev => prev + '\n🔄 Primary method failed, trying fallback...');
        userData = getTelegramUserFallback();
      }
      
      if (userData) {
        setUser(userData);
        console.log('✅ User data set successfully:', userData);
        setDebugInfo(prev => prev + '\n✅ User data set successfully: ' + JSON.stringify(userData, null, 2));
      } else {
        console.log('❌ No user data could be retrieved from any method');
        setDebugInfo(prev => prev + '\n❌ No user data could be retrieved from any method');
      }
      
      setIsInitialized(true);
      
          } catch (error) {
        console.error('❌ Error initializing Telegram app:', error);
        setDebugInfo(prev => prev + '\n❌ Error: ' + (error instanceof Error ? error.message : String(error)));
        setIsInitialized(true);
      }
  };

  useEffect(() => {
    // For iPhone compatibility, we need to wait longer for Telegram to inject data
    // iPhone Telegram can take up to 2-3 seconds to fully initialize
    const initTimer = setTimeout(() => {
      initApp();
    }, 500); // Increased delay for iPhone compatibility
    
    // Also try again after a longer delay as a fallback
    const retryTimer = setTimeout(() => {
      if (!user && isInitialized) {
        console.log('🔄 Retrying Telegram initialization for iPhone compatibility...');
        setDebugInfo(prev => prev + '\n\n🔄 RETRYING FOR IPHONE COMPATIBILITY...');
        initApp();
      }
    }, 3000); // 3 second retry for iPhone
    
    return () => {
      clearTimeout(initTimer);
      clearTimeout(retryTimer);
    };
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
