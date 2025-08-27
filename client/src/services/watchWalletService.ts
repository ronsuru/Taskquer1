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
      console.log(`[WATCH SERVICE] Fetching data for address: ${address}`);
      
      // Call the backend API to get real wallet data
      const response = await fetch(`/api/watch-wallet/${address}`);
      
      console.log(`[WATCH SERVICE] Response status: ${response.status}`);
      console.log(`[WATCH SERVICE] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // Try to get error details
        let errorText = '';
        try {
          errorText = await response.text();
          console.error(`[WATCH SERVICE] Error response body:`, errorText);
        } catch (e) {
          console.error(`[WATCH SERVICE] Could not read error response body:`, e);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`[WATCH SERVICE] Unexpected content type: ${contentType}`);
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }
      
      const data = await response.json();
      console.log(`[WATCH SERVICE] Successfully parsed response:`, data);
      
      return {
        address: data.address,
        balance: data.balance,
        usdtBalance: data.usdtBalance,
        transactions: data.transactions || []
      };
    } catch (error) {
      console.error('[WATCH SERVICE] API call failed:', error);
      throw new Error(`Failed to fetch wallet data: ${error}`);
    }
  }



  private validateTONAddress(address: string): boolean {
    // Comprehensive TON address validation
    // TON addresses can start with various prefixes:
    // - EQ: External Query (workchain 0, bounceable)
    // - UQ: User Query (workchain 0, non-bounceable)
    // - 0:0: Raw format (workchain 0)
    // - -1: Raw format (workchain -1)
    // - 0:1: Raw format (workchain 0, bounceable)
    // - 0:0: Raw format (workchain 0, non-bounceable)
    
    // More flexible validation - allow any reasonable TON address format
    if (!address || address.length < 10) {
      return false;
    }
    
    // Check for common TON address prefixes
    if (address.startsWith('EQ') || address.startsWith('UQ')) {
      // EQ/UQ addresses should be 48-50 characters total (2 prefix + 46-48 base64)
      return address.length >= 48 && address.length <= 50;
    }
    
    // Check for workchain format (e.g., 0:0:...)
    if (address.includes(':')) {
      const parts = address.split(':');
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        return lastPart.length >= 40 && lastPart.length <= 60;
      }
    }
    
    // For any other format, just check if it's reasonable length and valid chars
    const validChars = /^[A-Za-z0-9+/=:]+$/;
    return validChars.test(address) && address.length >= 40 && address.length <= 60;
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

  // Convert address to a standardized display format
  normalizeAddress(address: string): string {
    try {
      // If it's already a user-friendly format (EQ/UQ), return as is
      if (address.startsWith('EQ') || address.startsWith('UQ')) {
        return address;
      }
      
      // For raw hex formats, try to convert to bounceable format for consistency
      // This is a simplified conversion - in production you might want to use a proper TON library
      if (address.includes(':')) {
        // For now, return the original address
        // TODO: Implement proper conversion using TON libraries
        return address;
      }
      
      return address;
    } catch (error) {
      console.error('Error normalizing address:', error);
      return address;
    }
  }

  // Cleanup method
  cleanup(): void {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
  }
}

export const watchWalletService = WatchWalletService.getInstance();
