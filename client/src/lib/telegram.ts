import { WebApp } from '@twa-dev/sdk';

// Telegram Web App initialization
export const initTelegramApp = () => {
  // Initialize the Telegram Web App
  WebApp.ready();
  
  // Expand the app to full height
  WebApp.expand();
  
  // Set the header color to match your brand
  WebApp.setHeaderColor('#1a1a1a');
  
  // Enable closing confirmation
  WebApp.enableClosingConfirmation();
  
  return WebApp;
};

// Get Telegram user data
export const getTelegramUser = () => {
  if (WebApp.initDataUnsafe?.user) {
    const user = WebApp.initDataUnsafe.user;
    console.log('Raw Telegram user data:', user);
    
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
  return typeof window !== 'undefined' && (window.Telegram?.WebApp || WebApp.initDataUnsafe?.user);
};

// Get Telegram init data for validation
export const getTelegramInitData = () => {
  return WebApp.initData;
};

// Get Telegram init data hash for validation
export const getTelegramInitDataHash = () => {
  return WebApp.initDataHash;
};
