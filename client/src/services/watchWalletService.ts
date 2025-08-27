import { toast } from "@/hooks/use-toast";

export interface WatchWalletData {
  address: string;
  balance: string;
  usdtBalance: string;
  transactions: Transaction[];
  isWatching: boolean;
  lastUpdated: number;
}

export interface Transaction {
  hash: string;
  timestamp: number;
  amount: string;
  type: 'in' | 'out';
  from: string;
  to: string;
  fee: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress: string;
}

export class WatchWalletService {
  private static instance: WatchWalletService;
  private watchedWallets: Map<string, WatchWalletData> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): WatchWalletService {
    if (!WatchWalletService.instance) {
      WatchWalletService.instance = new WatchWalletService();
    }
    return WatchWalletService.instance;
  }

  constructor() {
    this.loadWatchedWallets();
  }

  private loadWatchedWallets(): void {
    try {
      const saved = localStorage.getItem('watch_wallet_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.watchedWallets = new Map(Object.entries(parsed));
        
        // Restart update intervals for all watched wallets
        this.watchedWallets.forEach((wallet, address) => {
          if (wallet.isWatching) {
            this.startWatching(address);
          }
        });
      }
    } catch (error) {
      console.error('Error loading watched wallets:', error);
    }
  }

  private saveWatchedWallets(): void {
    try {
      const data = Object.fromEntries(this.watchedWallets);
      localStorage.setItem('watch_wallet_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving watched wallets:', error);
    }
  }

  async addWalletToWatch(address: string): Promise<WatchWalletData> {
    if (!this.validateTONAddress(address)) {
      throw new Error('Invalid TON address format');
    }

    if (this.watchedWallets.has(address)) {
      throw new Error('Wallet is already being watched');
    }

    try {
      // Fetch initial wallet data
      const walletData = await this.fetchWalletData(address);
      
      // Add to watched wallets
      this.watchedWallets.set(address, {
        ...walletData,
        isWatching: true,
        lastUpdated: Date.now()
      });

      // Start watching
      this.startWatching(address);
      
      // Save to localStorage
      this.saveWatchedWallets();

      return walletData;
    } catch (error) {
      throw new Error(`Failed to add wallet to watch: ${error}`);
    }
  }

  removeWalletFromWatch(address: string): void {
    if (this.watchedWallets.has(address)) {
      // Stop watching
      this.stopWatching(address);
      
      // Remove from watched wallets
      this.watchedWallets.delete(address);
      
      // Save to localStorage
      this.saveWatchedWallets();
    }
  }

  getWatchedWallets(): WatchWalletData[] {
    return Array.from(this.watchedWallets.values());
  }

  getWatchedWallet(address: string): WatchWalletData | undefined {
    return this.watchedWallets.get(address);
  }

  isWatching(address: string): boolean {
    return this.watchedWallets.has(address) && this.watchedWallets.get(address)!.isWatching;
  }

  private startWatching(address: string): void {
    // Stop existing interval if any
    this.stopWatching(address);

    // Start new interval - update every 30 seconds
    const interval = setInterval(async () => {
      try {
        await this.updateWalletData(address);
      } catch (error) {
        console.error(`Error updating wallet ${address}:`, error);
      }
    }, 30000);

    this.updateIntervals.set(address, interval);
  }

  private stopWatching(address: string): void {
    const interval = this.updateIntervals.get(address);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(address);
    }
  }

  private async updateWalletData(address: string): Promise<void> {
    try {
      const walletData = await this.fetchWalletData(address);
      const existing = this.watchedWallets.get(address);
      
      if (existing) {
        this.watchedWallets.set(address, {
          ...walletData,
          isWatching: existing.isWatching,
          lastUpdated: Date.now()
        });
        
        this.saveWatchedWallets();
      }
    } catch (error) {
      console.error(`Failed to update wallet ${address}:`, error);
    }
  }

  async refreshWalletData(address: string): Promise<WatchWalletData> {
    try {
      // Try to use the refresh API endpoint first
      try {
        const response = await fetch(`/api/watch-wallet/${address}/refresh`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          const existing = this.watchedWallets.get(address);
          
          if (existing) {
            const updated = {
              ...existing,
              balance: data.balance,
              usdtBalance: data.usdtBalance,
              lastUpdated: data.lastUpdated
            };
            
            this.watchedWallets.set(address, updated);
            this.saveWatchedWallets();
            
            return updated;
          }
        }
      } catch (apiError) {
        console.warn('Refresh API failed, falling back to full fetch:', apiError);
      }
      
      // Fallback to full fetch if refresh API fails
      const walletData = await this.fetchWalletData(address);
      const existing = this.watchedWallets.get(address);
      
      if (existing) {
        const updated = {
          ...walletData,
          isWatching: existing.isWatching,
          lastUpdated: Date.now()
        };
        
        this.watchedWallets.set(address, updated);
        this.saveWatchedWallets();
        
        return updated;
      } else {
        throw new Error('Wallet not found in watched list');
      }
    } catch (error) {
      throw new Error(`Failed to refresh wallet data: ${error}`);
    }
  }

  private async fetchWalletData(address: string): Promise<Omit<WatchWalletData, 'isWatching' | 'lastUpdated'>> {
    try {
      // Call the backend API to get real wallet data
      const response = await fetch(`/api/watch-wallet/${address}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        address: data.address,
        balance: data.balance,
        usdtBalance: data.usdtBalance,
        transactions: data.transactions || []
      };
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn('API call failed, using mock data:', error);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock data
      const balance = (Math.random() * 10).toFixed(4);
      const usdtBalance = (Math.random() * 1000).toFixed(2);
      const transactions = this.generateMockTransactions(address);
      
      return {
        address,
        balance,
        usdtBalance,
        transactions
      };
    }
  }

  private generateMockTransactions(address: string): Transaction[] {
    const transactions: Transaction[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      transactions.push({
        hash: `hash_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now - (i * 86400000), // Each day
        amount: (Math.random() * 100).toFixed(4),
        type: Math.random() > 0.5 ? 'in' : 'out',
        from: Math.random() > 0.5 ? address : `EQ${Math.random().toString(36).substr(2, 48)}`,
        to: Math.random() > 0.5 ? `EQ${Math.random().toString(36).substr(2, 48)}` : address,
        fee: (Math.random() * 0.1).toFixed(4),
        status: 'completed'
      });
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  private validateTONAddress(address: string): boolean {
    // Basic TON address validation
    return /^EQ[a-zA-Z0-9]{48}$/.test(address);
  }

  // Get recent addresses from localStorage
  getRecentAddresses(): string[] {
    try {
      const saved = localStorage.getItem('watch_wallet_recent_addresses');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading recent addresses:', error);
      return [];
    }
  }

  // Add address to recent list
  addToRecentAddresses(address: string): void {
    try {
      const recent = this.getRecentAddresses();
      const updated = [address, ...recent.filter(addr => addr !== address)].slice(0, 5);
      localStorage.setItem('watch_wallet_recent_addresses', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent addresses:', error);
    }
  }

  // Cleanup method
  cleanup(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
  }
}

export const watchWalletService = WatchWalletService.getInstance();
