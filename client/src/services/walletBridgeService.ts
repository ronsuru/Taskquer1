import { useTelegram } from '@/contexts/TelegramContext';

export interface WalletBotIntegration {
  openWallet: () => void;
  openWalletWithAction: (action: 'send' | 'receive' | 'history' | 'settings') => void;
  openWalletWithAddress: (address: string) => void;
  openWalletWithAmount: (amount: string, address?: string) => void;
  isWalletBotAvailable: () => boolean;
}

export class WalletBridgeService implements WalletBotIntegration {
  private isTelegramApp: boolean;

  constructor() {
    // Check if we're running in Telegram
    this.isTelegramApp = typeof window !== 'undefined' && 
      'Telegram' in window && 
      'WebApp' in (window as any).Telegram;
  }

  /**
   * Open the @wallet bot directly
   */
  openWallet(): void {
    if (this.isTelegramApp) {
      try {
        // Try to open the @wallet mini-app directly
        (window as any).Telegram.WebApp.openTelegramLink('https://t.me/wallet?start=taskquer');
      } catch (error) {
        console.log('Direct mini-app opening failed, using fallback');
        // Fallback to bot chat
        (window as any).Telegram.WebApp.openTelegramLink('https://t.me/wallet?start=taskquer');
      }
    } else {
      // Fallback for non-Telegram environments
      window.open('https://t.me/wallet?start=taskquer', '_blank');
    }
  }

  /**
   * Open @wallet bot with specific action
   */
  openWalletWithAction(action: 'send' | 'receive' | 'history' | 'settings'): void {
    const actionParams = {
      send: 'send',
      receive: 'receive', 
      history: 'history',
      settings: 'settings'
    };

    const url = `https://t.me/wallet?start=taskquer_${actionParams[action]}`;
    
    if (this.isTelegramApp) {
      try {
        (window as any).Telegram.WebApp.openTelegramLink(url);
      } catch (error) {
        console.log('Direct action opening failed, using fallback');
        (window as any).Telegram.WebApp.openTelegramLink(url);
      }
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Open @wallet bot with specific address
   */
  openWalletWithAddress(address: string): void {
    const url = `https://t.me/wallet?start=taskquer_address_${address}`;
    
    if (this.isTelegramApp) {
      try {
        (window as any).Telegram.WebApp.openTelegramLink(url);
      } catch (error) {
        console.log('Direct address opening failed, using fallback');
        (window as any).Telegram.WebApp.openTelegramLink(url);
      }
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Open @wallet bot with amount and optional address
   */
  openWalletWithAmount(amount: string, address?: string): void {
    let url = `https://t.me/wallet?start=taskquer_amount_${amount}`;
    if (address) {
      url += `_to_${address}`;
    }
    
    if (this.isTelegramApp) {
      try {
        (window as any).Telegram.WebApp.openTelegramLink(url);
      } catch (error) {
        console.log('Direct amount opening failed, using fallback');
        (window as any).Telegram.WebApp.openTelegramLink(url);
      }
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Check if @wallet bot is available
   */
  isWalletBotAvailable(): boolean {
    return this.isTelegramApp;
  }

  /**
   * Show a popup with wallet options
   */
  showWalletOptions(): void {
    if (this.isTelegramApp) {
      (window as any).Telegram.WebApp.showPopup({
        title: 'TON Wallet Options',
        message: 'Choose how you want to interact with your wallet:',
        buttons: [
          {
            type: 'default',
            text: '💰 Send TON',
            id: 'send_ton'
          },
          {
            type: 'default',
            text: '📥 Receive TON',
            id: 'receive_ton'
          },
          {
            type: 'default',
            text: '📊 Transaction History',
            id: 'history'
          },
          {
            type: 'default',
            text: '⚙️ Wallet Settings',
            id: 'settings'
          },
          {
            type: 'default',
            text: '🔗 Open @wallet Bot',
            id: 'open_wallet'
          }
        ]
      });

      // Handle button clicks
      (window as any).Telegram.WebApp.onEvent('popupClosed', (buttonId: string) => {
        switch (buttonId) {
          case 'send_ton':
            this.openWalletWithAction('send');
            break;
          case 'receive_ton':
            this.openWalletWithAction('receive');
            break;
          case 'history':
            this.openWalletWithAction('history');
            break;
          case 'settings':
            this.openWalletWithAction('settings');
            break;
          case 'open_wallet':
            this.openWallet();
            break;
        }
      });
    } else {
      // Fallback for non-Telegram environments
      this.openWallet();
    }
  }

  /**
   * Get wallet bot status and capabilities
   */
  getWalletBotInfo(): { available: boolean; features: string[] } {
    const features = [
      'Create new TON wallet',
      'Send and receive TON',
      'View transaction history',
      'Manage wallet settings',
      'Stake TON tokens',
      'Swap tokens',
      'NFT management'
    ];

    return {
      available: this.isWalletBotAvailable(),
      features
    };
  }
}

// Export singleton instance
export const walletBridgeService = new WalletBridgeService();
