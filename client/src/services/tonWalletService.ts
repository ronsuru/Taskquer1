import { TonConnect } from '@tonconnect/sdk';

export interface TONWalletData {
  balance: string;
  address: string;
  currency: string;
  isConnected: boolean;
}

export interface TONTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  from?: string;
  to?: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  hash?: string;
}

export interface SendTONParams {
  amount: string;
  recipientAddress: string;
  memo?: string;
}

export class TONWalletService {
  private connector: TonConnect;
  private walletData: TONWalletData | null = null;

  constructor() {
    try {
      // Initialize TonConnect with your app configuration
      this.connector = new TonConnect({
        manifestUrl: '/tonconnect-manifest.json'
      });
      console.log('TonConnect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TonConnect:', error);
      throw new Error('Failed to initialize wallet service');
    }
  }

  // Connect to TON wallet
  async connectWallet(): Promise<boolean> {
    try {
      console.log('Starting wallet connection...');
      
      // Check if already connected
      if (this.walletData?.isConnected) {
        console.log('Wallet already connected');
        return true;
      }

      // Set up status change listener before connecting
      this.connector.onStatusChange((wallet) => {
        console.log('Wallet status changed:', wallet);
        if (wallet) {
          this.walletData = {
            balance: '0',
            address: wallet.account.address,
            currency: 'TON',
            isConnected: true
          };
          console.log('Wallet connected successfully:', this.walletData);
          
          // Immediately fetch balance after connection
          this.getBalance();
        } else {
          console.log('Wallet disconnected');
          this.walletData = null;
        }
      });

      // Check if we're in Telegram mini-app environment
      const isTelegramApp = window.Telegram?.WebApp;
      console.log('Telegram mini-app detected:', !!isTelegramApp);

      // Try to detect available wallets first
      let availableWallets = [];
      try {
        if (typeof this.connector.getWallets === 'function') {
          availableWallets = await this.connector.getWallets();
          console.log('Available wallets detected:', availableWallets);
        } else {
          console.log('getWallets method not available, proceeding with connection attempt');
        }
      } catch (walletDetectionError) {
        console.log('Wallet detection failed, proceeding with connection attempt:', walletDetectionError);
      }

      // If wallets are detected, try to connect to them
      if (availableWallets.length > 0) {
        console.log('Attempting to connect to detected TON wallet...');
        try {
          await this.connector.connect();
          console.log('Connection request sent to detected wallet');
          
          // Wait longer for connection to be established
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if connection was successful
          const wallet = await this.connector.wallet;
          if (wallet) {
            console.log('Wallet connection confirmed:', wallet);
            return true;
          }
        } catch (tonConnectError) {
          console.log('TON Connect to detected wallet failed:', tonConnectError);
        }
      }

      // If no wallets detected or connection failed, try universal connection
      console.log('Attempting universal wallet connection...');
      try {
        await this.connector.connect();
        console.log('Universal connection request sent');
        
        // Wait longer for connection to be established
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if connection was successful
        const wallet = await this.connector.wallet;
        if (wallet) {
          console.log('Universal wallet connection confirmed:', wallet);
          return true;
        }
      } catch (universalConnectionError) {
        console.log('Universal connection failed:', universalConnectionError);
      }

      // Check if we have a wallet after all attempts
      const finalWallet = await this.connector.wallet;
      if (finalWallet) {
        console.log('Wallet found after connection attempts:', finalWallet);
        this.walletData = {
          balance: '0',
          address: finalWallet.account.address,
          currency: 'TON',
          isConnected: true
        };
        return true;
      }

      // Only fall back to demo mode if we're not in a Telegram mini-app
      if (!isTelegramApp) {
        console.log('Not in Telegram mini-app, using demo mode');
        this.walletData = {
          balance: '0.00',
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
          currency: 'TON',
          isConnected: true
        };
        console.log('Demo wallet connected:', this.walletData);
        return true;
      } else {
        console.log('In Telegram mini-app but wallet connection failed - user may need to install @wallet bot');
        throw new Error('Wallet connection failed. Please make sure you have the @wallet bot installed in Telegram.');
      }
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      
      // Only show demo mode in non-Telegram environments
      if (!window.Telegram?.WebApp) {
        console.log('Falling back to demo mode due to error');
        this.walletData = {
          balance: '0.00',
          address: 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
          currency: 'TON',
          isConnected: true
        };
        console.log('Demo wallet connected after error fallback:', this.walletData);
        return true;
      } else {
        // Re-throw the error for Telegram mini-app users
        throw error;
      }
    }
  }

  // Disconnect wallet
  async disconnectWallet(): Promise<void> {
    try {
      await this.connector.disconnect();
      this.walletData = null;
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }

  // Get wallet data
  getWalletData(): TONWalletData | null {
    return this.walletData;
  }

  // Get connection method for user feedback
  getConnectionMethod(): string {
    if (!this.walletData?.isConnected) {
      return 'Not Connected';
    }
    
    // Check if we're in Telegram mini-app
    if (window.Telegram?.WebApp) {
      return 'TON Connect (Telegram)';
    }
    
    // Check if it's a demo wallet
    if (this.walletData.address === 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t') {
      return 'Demo Mode';
    }
    
    return 'TON Connect';
  }

  // Get wallet balance
  async getBalance(): Promise<string> {
    try {
      if (!this.walletData?.address) {
        throw new Error('Wallet not connected');
      }

      // Use TON API to get balance
      const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${this.walletData.address}`);
      const data = await response.json();
      
      if (data.ok) {
        // Convert from nano TON to TON
        const balanceInTON = (parseInt(data.result) / 1e9).toFixed(2);
        
        if (this.walletData) {
          this.walletData.balance = balanceInTON;
        }
        
        return balanceInTON;
      } else {
        throw new Error('Failed to fetch balance');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0.00';
    }
  }

  // Send TON
  async sendTON(params: SendTONParams): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      if (!this.walletData?.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Create transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: params.recipientAddress,
            amount: (parseFloat(params.amount) * 1e9).toString(), // Convert to nano TON
            memo: params.memo || ''
          }
        ]
      };

      // Send transaction
      const result = await this.connector.sendTransaction(transaction);
      
      if (result) {
        return {
          success: true,
          hash: result.toString()
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error sending TON:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get transaction history
  async getTransactionHistory(): Promise<TONTransaction[]> {
    try {
      if (!this.walletData?.address) {
        return [];
      }

      // Use TON API to get transaction history
      const response = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${this.walletData.address}&limit=20`);
      const data = await response.json();
      
      if (data.ok) {
        return data.result.map((tx: any) => ({
          id: tx.hash,
          type: tx.in_msg?.source === '' ? 'receive' : 'send',
          amount: (parseInt(tx.in_msg?.value || '0') / 1e9).toFixed(2),
          from: tx.in_msg?.source || 'Unknown',
          to: tx.out_msgs?.[0]?.destination || 'Unknown',
          date: new Date(tx.utime * 1000).toISOString().split('T')[0],
          status: 'completed',
          hash: tx.hash
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.walletData?.isConnected || false;
  }

  // Check if TON Connect is available
  isTONConnectAvailable(): boolean {
    try {
      return typeof this.connector !== 'undefined' && this.connector !== null;
    } catch {
      return false;
    }
  }

  // Get connection method info
  getConnectionMethod(): string {
    if (this.walletData?.isConnected) {
      return this.walletData.address === 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t' ? 'Demo Mode' : 'TON Connect';
    }
    return 'Not Connected';
  }

  // Get wallet address
  getAddress(): string | null {
    return this.walletData?.address || null;
  }

  // Refresh wallet connection status
  async refreshConnectionStatus(): Promise<boolean> {
    try {
      await this.connector.restoreConnection();
      
      // Check if wallet is connected after restore
      const wallet = await this.connector.wallet;
      if (wallet) {
        this.walletData = {
          balance: '0',
          address: wallet.account.address,
          currency: 'TON',
          isConnected: true
        };
        // Fetch current balance
        await this.getBalance();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing connection status:', error);
      return false;
    }
  }

  // Format TON amount
  formatTONAmount(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }

  // Validate TON address
  validateTONAddress(address: string): boolean {
    // Basic TON address validation
    const tonAddressRegex = /^EQ[a-zA-Z0-9]{48}$/;
    return tonAddressRegex.test(address);
  }
}

// Export singleton instance
export const tonWalletService = new TONWalletService();
