import { TonConnect } from '@tonconnect/sdk';

// TON Connect configuration
export const tonConnectOptions = {
  manifestUrl: 'https://taskquer2.vercel.app/tonconnect-manifest.json',
  items: [
    {
      name: 'ton_addr',
      maxVersion: 1
    },
    {
      name: 'ton_proof',
      maxVersion: 1
    }
  ]
};

// Initialize TON Connect with error handling
let connector: TonConnect;

try {
  connector = new TonConnect(tonConnectOptions);
  console.log('TON Connect initialized successfully');
} catch (error) {
  console.error('Failed to initialize TON Connect:', error);
  // Create a fallback connector
  connector = new TonConnect({
    manifestUrl: 'https://taskquer2.vercel.app/tonconnect-manifest.json'
  });
}

// Wallet connection status
export const getWalletConnectionStatus = () => {
  try {
    return connector.connected;
  } catch (error) {
    console.error('Error getting wallet connection status:', error);
    return false;
  }
};

// Get connected wallet address
export const getConnectedWalletAddress = () => {
  try {
    if (connector.connected) {
      return connector.account?.address;
    }
    return null;
  } catch (error) {
    console.error('Error getting connected wallet address:', error);
    return null;
  }
};

// Get wallet balance
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`);
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.result) {
        // Convert from nano to TON (9 decimals)
        return (parseInt(data.result) / 1e9).toFixed(2);
      }
    }
    return '0.00';
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return '0.00';
  }
};

// Get USDT balance from TON blockchain
export const getUSDTBalance = async (address: string): Promise<string> => {
  try {
    // Try to get USDT balance from TON Center API
    const response = await fetch(`https://toncenter.com/api/v2/getAddressInfo?address=${address}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.ok && data.result && data.result.jettons) {
        // Look for USDT jetton
        for (const jetton of data.result.jettons) {
          if (jetton.metadata && 
              (jetton.metadata.symbol === 'USDT' || 
               jetton.metadata.symbol === 'USD₮')) {
            // Convert from nano to USDT (6 decimals)
            const balance = (parseInt(jetton.balance) / 1e6).toFixed(2);
            return balance;
          }
        }
      }
    }
    
    return '0.00';
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    return '0.00';
  }
};

// Get all token balances
export const getAllTokenBalances = async (address: string) => {
  try {
    const [tonBalance, usdtBalance] = await Promise.all([
      getWalletBalance(address),
      getUSDTBalance(address)
    ]);

    return {
      TON: { balance: tonBalance, decimals: 9 },
      USDT: { balance: usdtBalance, decimals: 6 }
    };
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return {
      TON: { balance: '0.00', decimals: 9 },
      USDT: { balance: '0.00', decimals: 6 }
    };
  }
};

// Disconnect wallet
export const disconnectWallet = () => {
  try {
    connector.disconnect();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
};

// Subscribe to wallet changes
export const subscribeToWalletChanges = (callback: (account: any) => void) => {
  try {
    return connector.onStatusChange(callback);
  } catch (error) {
    console.error('Error subscribing to wallet changes:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

// Export the connector for direct use
export { connector };
