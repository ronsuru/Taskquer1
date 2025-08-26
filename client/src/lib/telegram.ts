import { WebApp } from '@twa-dev/sdk';

// Telegram Web App initialization
export const initTelegramApp = () => {
  console.log('🚀 Initializing Telegram Web App...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  
  try {
    // Initialize the Telegram Web App
    WebApp.ready();
    console.log('✅ WebApp.ready() called');
    
    // Expand the app to full height
    WebApp.expand();
    console.log('✅ WebApp.expand() called');
    
    // Set the header color to match your brand
    WebApp.setHeaderColor('#1a1a1a');
    console.log('✅ WebApp.setHeaderColor() called');
    
    // Enable closing confirmation
    WebApp.enableClosingConfirmation();
    console.log('✅ WebApp.enableClosingConfirmation() called');
    
    return WebApp;
  } catch (error) {
    console.error('❌ Error initializing Telegram Web App:', error);
    throw error;
  }
};

// Get Telegram user data
export const getTelegramUser = () => {
  console.log('🔍 Checking Telegram WebApp data...');
  console.log('WebApp object:', WebApp);
  console.log('WebApp.initDataUnsafe:', WebApp.initDataUnsafe);
  console.log('WebApp.initDataUnsafe?.user:', WebApp.initDataUnsafe?.user);
  console.log('WebApp.initData:', WebApp.initData);
  console.log('WebApp.initDataHash:', WebApp.initDataHash);
  
  if (WebApp.initDataUnsafe?.user) {
    const user = WebApp.initDataUnsafe.user;
    console.log('✅ Raw Telegram user data found:', user);
    
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium,
      photoUrl: user.photo_url || null,
    };
  }
  
  console.log('❌ No Telegram user data found');
  return null;
};

// Get Telegram chat data
export const getTelegramChat = () => {
  if (WebApp.initDataUnsafe?.chat) {
    return {
      id: WebApp.initDataUnsafe.chat.id,
      type: WebApp.initDataUnsafe.chat.type,
      title: WebApp.initDataUnsafe.chat.title,
      username: WebApp.initDataUnsafe.chat.username,
      photoUrl: WebApp.initDataUnsafe.chat.photo?.big_file_id,
    };
  }
  return null;
};

// Show Telegram alert
export const showTelegramAlert = (message: string, callback?: () => void) => {
  WebApp.showAlert(message, callback);
};

// Show Telegram confirm
export const showTelegramConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
  WebApp.showConfirm(message, callback);
};

// Show Telegram popup
export const showTelegramPopup = (title: string, message: string, buttons: any[], callback?: (buttonId: string) => void) => {
  WebApp.showPopup({ title, message, buttons }, callback);
};

// Get Telegram theme
export const getTelegramTheme = () => {
  return WebApp.colorScheme; // 'light' | 'dark'
};

// Get Telegram viewport
export const getTelegramViewport = () => {
  return {
    height: WebApp.viewportHeight,
    width: WebApp.viewportWidth,
    isExpanded: WebApp.isExpanded,
  };
};

// Close the Telegram Web App
export const closeTelegramApp = () => {
  WebApp.close();
};

// Check if running in Telegram
export const isTelegramWebApp = () => {
  const hasTelegramWebApp = typeof window !== 'undefined' && window.Telegram?.WebApp;
  const hasWebAppSDK = typeof WebApp !== 'undefined';
  const hasUserData = WebApp?.initDataUnsafe?.user;
  
  console.log('🔍 Telegram WebApp Detection:');
  console.log('  - window.Telegram?.WebApp:', !!hasTelegramWebApp);
  console.log('  - WebApp SDK available:', hasWebAppSDK);
  console.log('  - Has user data:', !!hasUserData);
  
  return hasTelegramWebApp || hasWebAppSDK || hasUserData;
};

// Get Telegram init data for validation
export const getTelegramInitData = () => {
  return WebApp.initData;
};

// Get Telegram init data hash for validation
export const getTelegramInitDataHash = () => {
  return WebApp.initDataHash;
};

// Try multiple methods to get user data
export const getTelegramUserFallback = () => {
  console.log('🔄 Trying fallback methods to get Telegram user data...');
  
  // Method 1: WebApp.initDataUnsafe.user
  if (WebApp.initDataUnsafe?.user) {
    console.log('✅ Method 1 successful: WebApp.initDataUnsafe.user');
    return WebApp.initDataUnsafe.user;
  }
  
  // Method 2: window.Telegram.WebApp.initDataUnsafe.user
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    console.log('✅ Method 2 successful: window.Telegram.WebApp.initDataUnsafe.user');
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  
  // Method 3: Parse initData manually
  if (WebApp.initData) {
    try {
      const urlParams = new URLSearchParams(WebApp.initData);
      const userParam = urlParams.get('user');
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Method 3 successful: Parsed from initData');
        return userData;
      }
    } catch (error) {
      console.log('❌ Method 3 failed: Could not parse initData');
    }
  }
  
  // Method 4: Check for Telegram WebApp global
  if (typeof window !== 'undefined' && (window as any).TelegramWebApp) {
    const userData = (window as any).TelegramWebApp.initDataUnsafe?.user;
    if (userData) {
      console.log('✅ Method 4 successful: window.TelegramWebApp');
      return userData;
    }
  }
  
  console.log('❌ All fallback methods failed');
  return null;
};
