export interface SocialMediaAccount {
  platform: string;
  username: string;
  userId: string;
  isConnected: boolean;
  profileUrl?: string;
  avatarUrl?: string;
}

export interface SocialMediaAuthConfig {
  facebook: {
    appId: string;
    redirectUri: string;
    scope: string;
  };
  twitter: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  youtube: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  discord: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  tiktok: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
}

class SocialMediaService {
  private config: SocialMediaAuthConfig;
  private connectedAccounts: Map<string, SocialMediaAccount> = new Map();

  constructor() {
    // Initialize with your app's OAuth credentials
    this.config = {
      facebook: {
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
        redirectUri: `${window.location.origin}/auth/facebook/callback`,
        scope: 'email,public_profile'
      },
      twitter: {
        clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || 'your-twitter-client-id',
        redirectUri: `${window.location.origin}/auth/twitter/callback`,
        scope: 'tweet.read,users.read'
      },
      youtube: {
        clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID || 'your-youtube-client-id',
        redirectUri: `${window.location.origin}/auth/youtube/callback`,
        scope: 'https://www.googleapis.com/auth/youtube.readonly'
      },
      discord: {
        clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || 'your-discord-client-id',
        redirectUri: `${window.location.origin}/auth/discord/callback`,
        scope: 'identify'
      },
      tiktok: {
        clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID || 'your-tiktok-client-id',
        redirectUri: `${window.location.origin}/auth/tiktok/callback`,
        scope: 'user.info.basic'
      }
    };
  }

  // Facebook OAuth
  async connectFacebook(): Promise<void> {
    const { appId, redirectUri, scope } = this.config.facebook;
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    // Open Facebook OAuth in a popup or redirect
    this.openOAuthWindow(authUrl, 'facebook');
  }

  // Twitter OAuth
  async connectTwitter(): Promise<void> {
    const { clientId, redirectUri, scope } = this.config.twitter;
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=state`;
    
    this.openOAuthWindow(authUrl, 'twitter');
  }

  // YouTube OAuth
  async connectYouTube(): Promise<void> {
    const { clientId, redirectUri, scope } = this.config.youtube;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline`;
    
    this.openOAuthWindow(authUrl, 'youtube');
  }

  // Discord OAuth
  async connectDiscord(): Promise<void> {
    const { clientId, redirectUri, scope } = this.config.discord;
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    this.openOAuthWindow(authUrl, 'discord');
  }

  // TikTok OAuth
  async connectTikTok(): Promise<void> {
    const { clientId, redirectUri, scope } = this.config.tiktok;
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=state`;
    
    this.openOAuthWindow(authUrl, 'tiktok');
  }

  // Open OAuth window
  private openOAuthWindow(authUrl: string, platform: string): void {
    // For Telegram Mini App, we'll use the Telegram WebApp's openTelegramLink method
    if (window.Telegram?.WebApp) {
      // Open in Telegram's built-in browser
      window.Telegram.WebApp.openTelegramLink(authUrl);
    } else {
      // Fallback to popup window for regular web browsers
      const popup = window.open(
        authUrl,
        `${platform}_oauth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (popup) {
        // Listen for the popup to close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            this.checkOAuthStatus(platform);
          }
        }, 1000);
      }
    }
  }

  // Check OAuth status after redirect
  private async checkOAuthStatus(platform: string): Promise<void> {
    try {
      // This would typically check with your backend to see if the OAuth was successful
      // For now, we'll simulate a successful connection
      const mockAccount: SocialMediaAccount = {
        platform,
        username: `@${platform}_user_${Date.now()}`,
        userId: `user_${Date.now()}`,
        isConnected: true,
        profileUrl: `https://${platform}.com/user`,
        avatarUrl: `https://via.placeholder.com/40/40?text=${platform.charAt(0).toUpperCase()}`
      };

      this.connectedAccounts.set(platform, mockAccount);
      
      // Emit an event that the dashboard can listen to
      window.dispatchEvent(new CustomEvent('socialMediaConnected', {
        detail: { platform, account: mockAccount }
      }));

    } catch (error) {
      console.error(`Failed to check ${platform} OAuth status:`, error);
    }
  }

  // Disconnect social media account
  async disconnectAccount(platform: string): Promise<void> {
    try {
      // This would typically call your backend to revoke the OAuth token
      this.connectedAccounts.delete(platform);
      
      // Emit disconnect event
      window.dispatchEvent(new CustomEvent('socialMediaDisconnected', {
        detail: { platform }
      }));

    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
    }
  }

  // Get connected accounts
  getConnectedAccounts(): SocialMediaAccount[] {
    return Array.from(this.connectedAccounts.values());
  }

  // Check if a platform is connected
  isPlatformConnected(platform: string): boolean {
    return this.connectedAccounts.has(platform);
  }

  // Get account for a specific platform
  getAccount(platform: string): SocialMediaAccount | undefined {
    return this.connectedAccounts.get(platform);
  }

  // Handle OAuth callback (called from your backend after successful OAuth)
  handleOAuthCallback(platform: string, code: string, state?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // This would typically send the authorization code to your backend
      // to exchange it for an access token
      console.log(`Received OAuth callback for ${platform} with code:`, code);
      
      // Simulate API call to your backend
      setTimeout(() => {
        this.checkOAuthStatus(platform);
        resolve();
      }, 1000);
    });
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();
