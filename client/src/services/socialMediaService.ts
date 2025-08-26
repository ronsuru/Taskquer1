export interface SocialMediaAccount {
  platform: string;
  username: string;
  userId: string;
  isConnected: boolean;
  profileUrl?: string;
  avatarUrl?: string;
}

// No OAuth config needed - users connect their own accounts

class SocialMediaService {
  private connectedAccounts: Map<string, SocialMediaAccount> = new Map();

  constructor() {
    // No OAuth credentials needed - users connect their own accounts
  }

  // Facebook Connection
  async connectFacebook(): Promise<void> {
    // Direct link to Facebook login - users authenticate with their own accounts
    const facebookUrl = 'https://www.facebook.com/login';
    this.openPlatformWindow(facebookUrl, 'facebook');
  }

  // Twitter Connection
  async connectTwitter(): Promise<void> {
    // Direct link to Twitter login - users authenticate with their own accounts
    const twitterUrl = 'https://twitter.com/i/flow/login';
    this.openPlatformWindow(twitterUrl, 'twitter');
  }

  // YouTube Connection
  async connectYouTube(): Promise<void> {
    // Direct link to YouTube login - users authenticate with their own accounts
    const youtubeUrl = 'https://accounts.google.com/signin/v2/identifier?service=youtube';
    this.openPlatformWindow(youtubeUrl, 'youtube');
  }

  // Discord Connection
  async connectDiscord(): Promise<void> {
    // Direct link to Discord login - users authenticate with their own accounts
    const discordUrl = 'https://discord.com/login';
    this.openPlatformWindow(discordUrl, 'discord');
  }

  // TikTok Connection
  async connectTikTok(): Promise<void> {
    // Direct link to TikTok login - users authenticate with their own accounts
    const tiktokUrl = 'https://www.tiktok.com/login';
    this.openPlatformWindow(tiktokUrl, 'tiktok');
  }

  // Open platform window for user authentication
  private openPlatformWindow(platformUrl: string, platform: string): void {
    // For Telegram Mini App, we'll use the Telegram WebApp's openTelegramLink method
    if (window.Telegram?.WebApp) {
      // Open in Telegram's built-in browser
      window.Telegram.WebApp.openTelegramLink(platformUrl);
      
      // Simulate successful connection after a delay (for demo purposes)
      setTimeout(() => {
        this.simulateConnection(platform);
      }, 2000);
    } else {
      // Fallback to popup window for regular web browsers
      const popup = window.open(
        platformUrl,
        `${platform}_login`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (popup) {
        // Listen for the popup to close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            this.simulateConnection(platform);
          }
        }, 1000);
      }
    }
  }

  // Simulate successful connection (for demo purposes)
  private simulateConnection(platform: string): void {
    try {
      // Create a mock connected account
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
      console.error(`Failed to simulate ${platform} connection:`, error);
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

  // This method is no longer needed with direct platform login
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();
