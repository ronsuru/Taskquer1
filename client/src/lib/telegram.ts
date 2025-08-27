import WebApp from '@twa-dev/sdk';

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

// Wait for Telegram WebApp to be ready
export const waitForTelegramWebApp = (maxWaitTime = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkWebApp = () => {
      console.log('⏳ Checking if Telegram WebApp is ready...');
      
      // Check if WebApp has user data
      if (WebApp?.initDataUnsafe?.user) {
        console.log('✅ Telegram WebApp is ready with user data');
        resolve(true);
        return;
      }
      
      // Check if window.Telegram.WebApp has user data
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('✅ window.Telegram.WebApp is ready with user data');
        resolve(true);
        return;
      }
      
      // Check if we've waited too long
      if (Date.now() - startTime > maxWaitTime) {
        console.log('⏰ Timeout waiting for Telegram WebApp');
        resolve(false);
        return;
      }
      
      // Check again in 100ms
      setTimeout(checkWebApp, 100);
    };
    
    checkWebApp();
  });
};

// Get Telegram user data with improved methods
export const getTelegramUser = async () => {
  console.log('🔍 Getting Telegram user data...');
  
  // Wait for WebApp to be ready
  const isReady = await waitForTelegramWebApp();
  if (!isReady) {
    console.log('❌ Telegram WebApp not ready, trying fallback methods');
    return getTelegramUserFallback();
  }
  
  // Method 1: WebApp.initDataUnsafe.user (primary method)
  if (WebApp.initDataUnsafe?.user) {
    const user = WebApp.initDataUnsafe.user;
    console.log('✅ Primary method successful: WebApp.initDataUnsafe.user', user);
    
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
  
  // Method 2: window.Telegram.WebApp.initDataUnsafe.user
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
    const user = (window as any).Telegram.WebApp.initDataUnsafe.user;
    console.log('✅ Secondary method successful: window.Telegram.WebApp.initDataUnsafe.user', user);
    
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
  
  console.log('❌ Primary methods failed, trying fallback...');
  return getTelegramUserFallback();
};

// Get Telegram chat data
export const getTelegramChat = () => {
  if (WebApp.initDataUnsafe?.chat) {
    return {
      id: WebApp.initDataUnsafe.chat.id,
      type: WebApp.initDataUnsafe.chat.type,
      title: WebApp.initDataUnsafe.chat.title,
      username: WebApp.initDataUnsafe.chat.username,
      photoUrl: (WebApp.initDataUnsafe.chat as any).photo?.big_file_id || null,
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
export const showTelegramPopup = (title: string, message: string, buttons: any[], callback?: (id?: string) => void) => {
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
    width: (WebApp as any).viewportWidth || 0,
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
  return (WebApp as any).initDataHash || null;
};

// Enhanced fallback method with more comprehensive checks
export const getTelegramUserFallback = () => {
  console.log('🔄 Trying enhanced fallback methods to get Telegram user data...');
  
  // Method 1: WebApp.initDataUnsafe.user
  if (WebApp.initDataUnsafe?.user) {
    console.log('✅ Method 1 successful: WebApp.initDataUnsafe.user');
    const user = WebApp.initDataUnsafe.user;
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
  
  // Method 2: window.Telegram.WebApp.initDataUnsafe.user
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
    console.log('✅ Method 2 successful: window.Telegram.WebApp.initDataUnsafe.user');
    const user = (window as any).Telegram.WebApp.initDataUnsafe.user;
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
  
  // Method 3: Parse initData manually
  if (WebApp.initData) {
    try {
      const urlParams = new URLSearchParams(WebApp.initData);
      const userParam = urlParams.get('user');
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Method 3 successful: Parsed from initData');
        return {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          languageCode: userData.language_code,
          isPremium: userData.is_premium,
          photoUrl: userData.photo_url || null,
        };
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
      return {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
        isPremium: userData.is_premium,
        photoUrl: userData.photo_url || null,
      };
    }
  }
  
  // Method 5: Check URL hash for user data (some implementations use this)
  if (typeof window !== 'undefined' && window.location.hash) {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const userParam = hashParams.get('user');
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Method 5 successful: Parsed from URL hash');
        return {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          languageCode: userData.language_code,
          isPremium: userData.is_premium,
          photoUrl: userData.photo_url || null,
        };
      }
    } catch (error) {
      console.log('❌ Method 5 failed: Could not parse URL hash');
    }
  }
  
  // Method 6: Check for Telegram-specific global variables
  if (typeof window !== 'undefined') {
    const telegramGlobals = [
      'TelegramWebApp',
      'Telegram',
      'tgWebApp',
      'tg'
    ];
    
    for (const globalName of telegramGlobals) {
      const global = (window as any)[globalName];
      if (global?.initDataUnsafe?.user) {
        console.log(`✅ Method 6 successful: window.${globalName}`);
        const userData = global.initDataUnsafe.user;
        return {
          id: userData.id,
          firstName: userData.first_name,
          lastName: userData.last_name,
          username: userData.username,
          languageCode: userData.language_code,
          isPremium: userData.is_premium,
          photoUrl: userData.photo_url || null,
        };
      }
    }
  }
  
  console.log('❌ All fallback methods failed');
  return null;
};

// Comprehensive check for Telegram environment
export const checkTelegramEnvironment = () => {
  console.log('🔍 COMPREHENSIVE TELEGRAM ENVIRONMENT CHECK');
  console.log('==========================================');
  
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment');
    return false;
  }
  
  console.log('🌐 Browser Environment:');
  console.log('  - URL:', window.location.href);
  console.log('  - User Agent:', window.navigator.userAgent);
  console.log('  - Referrer:', window.document.referrer);
  
  console.log('📱 Telegram Objects:');
  console.log('  - window.Telegram:', !!(window as any).Telegram);
  console.log('  - window.Telegram?.WebApp:', !!(window as any).Telegram?.WebApp);
  console.log('  - window.TelegramWebApp:', !!(window as any).TelegramWebApp);
  
  if ((window as any).Telegram?.WebApp) {
    console.log('  - WebApp.initDataUnsafe:', (window as any).Telegram.WebApp.initDataUnsafe);
    console.log('  - WebApp.initDataUnsafe?.user:', (window as any).Telegram.WebApp.initDataUnsafe?.user);
    console.log('  - WebApp.initData:', (window as any).Telegram.WebApp.initData);
  }
  
  console.log('🔧 WebApp SDK:');
  console.log('  - WebApp object:', !!WebApp);
  if (WebApp) {
    console.log('  - WebApp.initDataUnsafe:', (WebApp as any).initDataUnsafe);
    console.log('  - WebApp.initDataUnsafe?.user:', (WebApp as any).initDataUnsafe?.user);
    console.log('  - WebApp.initData:', (WebApp as any).initData);
    console.log('  - WebApp.colorScheme:', (WebApp as any).colorScheme);
    console.log('  - WebApp.viewportHeight:', (WebApp as any).viewportHeight);
  }
  
  console.log('📋 URL Analysis:');
  const url = new URL(window.location.href);
  console.log('  - Protocol:', url.protocol);
  console.log('  - Hostname:', url.hostname);
  console.log('  - Pathname:', url.pathname);
  console.log('  - Search params:', Object.fromEntries(url.searchParams.entries()));
  console.log('  - Hash:', url.hash);
  
  console.log('==========================================');
  
  return !!((window as any).Telegram?.WebApp || (window as any).TelegramWebApp || (WebApp as any)?.initDataUnsafe?.user);
};
