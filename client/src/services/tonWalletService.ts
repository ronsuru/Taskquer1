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
    // Initialize TonConnect with your app configuration
    this.connector = new TonConnect({
      manifestUrl: '/tonconnect-manifest.json'
    });
  }

  // Connect to TON wallet
  async connectWallet(): Promise<boolean> {
    try {
      // Request wallet connection
      const walletConnectionSource = {
        universalUrl: 'https://app.tonkeeper.com/ton-connect',
        bridgeUrl: 'https://bridge.tonapi.io/bridge'
      };

      await this.connector.connect(walletConnectionSource);
      
      // Listen for connection status
      this.connector.onStatusChange((wallet) => {
        if (wallet) {
          this.walletData = {
            balance: '0',
            address: wallet.account.address,
            currency: 'TON',
            isConnected: true
          };
        } else {
          this.walletData = null;
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
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
          hash: result
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

  // Get wallet address
  getAddress(): string | null {
    return this.walletData?.address || null;
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
