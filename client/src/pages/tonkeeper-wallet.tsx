import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  RefreshCw, 
  Send, 
  QrCode, 
  Copy, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Link,
  Unlink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  connector, 
  getWalletConnectionStatus, 
  getConnectedWalletAddress,
  getWalletBalance,
  getUSDTBalance,
  getAllTokenBalances,
  disconnectWallet,
  subscribeToWalletChanges,
  handleBridgeError
} from '@/lib/tonconnect';

interface WalletData {
  address: string;
  balance: string;
  usdtBalance: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const TonkeeperWallet: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    address: '',
    balance: '0.00',
    usdtBalance: '0.00',
    isConnected: false,
    isLoading: false,
    error: null
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Check if TON Connect is available
  const isTONConnectAvailable = () => {
    return typeof window !== 'undefined' && connector !== undefined;
  };

  // Connect to TON wallet using TON Connect
  const connectWallet = async () => {
    if (!isTONConnectAvailable()) {
      toast({
        title: "TON Connect Not Available",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setWalletData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Attempting to connect to TON wallet...');
      
      // Check if connector is properly initialized
      if (!connector) {
        throw new Error('TON Connect connector not initialized');
      }

      // Open TON Connect modal
      await connector.connect();
      
      console.log('TON Connect modal opened successfully');
      
      // The connection will be handled by the subscription
      toast({
        title: "Connecting...",
        description: "Please approve the connection in your wallet",
      });
    } catch (error: any) {
      console.error('TON Connect error:', error);
      
      // Handle jsBridgekey errors specifically
      try {
        if (handleBridgeError(error) && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          toast({
            title: "Retrying Connection",
            description: `Bridge error detected, retrying... (${retryCount + 1}/${MAX_RETRIES})`,
          });
          // Try to connect again after a short delay
          setTimeout(() => {
            connectWallet();
          }, 2000); // Increased delay to 2 seconds
          return;
        } else if (retryCount >= MAX_RETRIES) {
          // Max retries reached, show final error
          setRetryCount(0); // Reset for next attempt
          setWalletData(prev => ({
            ...prev,
            isLoading: false,
            error: 'Maximum retry attempts reached. Please try again later.'
          }));
          
          toast({
            title: "Connection Failed",
            description: "Maximum retry attempts reached. Please try again later.",
            variant: "destructive"
          });
          return;
        }
      } catch (bridgeError) {
        console.error('Error in bridge error handler:', bridgeError);
      }
      
      let errorMessage = 'Failed to connect to wallet';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      setWalletData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    try {
      disconnectWallet();
      setWalletData({
        address: '',
        balance: '0.00',
        usdtBalance: '0.00',
        isConnected: false,
        isLoading: false,
        error: null
      });
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Get USDT balance from TON blockchain
  const getUSDTBalance = async (address: string): Promise<string> => {
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



  // Refresh wallet data
  const refreshWallet = async () => {
    if (!walletData.isConnected || !walletData.address) return;
    
    setWalletData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [balance, usdtBalance] = await Promise.all([
        getWalletBalance(walletData.address),
        getUSDTBalance(walletData.address)
      ]);
      
      setWalletData(prev => ({
        ...prev,
        balance,
        usdtBalance,
        isLoading: false
      }));
      
      toast({
        title: "Wallet Refreshed",
        description: "Balance updated successfully!",
      });
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      setWalletData(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Refresh Failed",
        description: "Could not update wallet balance",
        variant: "destructive"
      });
    }
  };

  // Subscribe to wallet changes
  useEffect(() => {
    const unsubscribe = subscribeToWalletChanges((account) => {
      if (account) {
        // Wallet connected
        const address = account.address;
        console.log('Wallet connected:', address);
        
                 // Fetch initial balances
         getAllTokenBalances(address).then(tokens => {
           setRetryCount(0); // Reset retry count on successful connection
           setWalletData({
             address,
             balance: tokens.TON.balance,
             usdtBalance: tokens.USDT.balance,
             isConnected: true,
             isLoading: false,
             error: null
           });
           
           toast({
             title: "Wallet Connected!",
             description: `Successfully connected to ${address.substring(0, 8)}...`,
           });
         });
      } else {
        // Wallet disconnected
        console.log('Wallet disconnected');
        setWalletData({
          address: '',
          balance: '0.00',
          usdtBalance: '0.00',
          isConnected: false,
          isLoading: false,
          error: null
        });
      }
    });

    // Check if already connected
    if (getWalletConnectionStatus()) {
      const address = getConnectedWalletAddress();
      if (address) {
        getAllTokenBalances(address).then(tokens => {
          setWalletData({
            address,
            balance: tokens.TON.balance,
            usdtBalance: tokens.USDT.balance,
            isConnected: true,
            isLoading: false,
            error: null
          });
        });
      }
    }

    return () => unsubscribe();
  }, []);

  // Copy address to clipboard
  const copyAddress = () => {
    if (walletData.address) {
      navigator.clipboard.writeText(walletData.address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard!",
      });
    }
  };

  // View on Tonviewer
  const viewOnTonviewer = () => {
    if (walletData.address) {
      window.open(`https://tonviewer.com/${walletData.address}`, '_blank');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
                 <h1 className="text-2xl font-bold flex items-center gap-2">
           <Wallet className="h-6 w-6" />
           TON Wallet Connect
         </h1>
        
        {walletData.isConnected && (
          <Button
            onClick={refreshWallet}
            disabled={walletData.isLoading}
            variant="outline"
            size="sm"
          >
            {walletData.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* Connection Status */}
      {!walletData.isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect to Tonkeeper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              TON Connect 2.0 available - Connect any TON wallet
            </div>
            
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Connect TON Wallet
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground text-center">
              <p>Supports: Tonkeeper, MyTonWallet, TonHub, and more</p>
              <p className="text-xs mt-1">No app installation required</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Connected Wallet View */
        <div className="space-y-6">
                     {/* Wallet Address */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 <span>Wallet Address</span>
                 <div className="flex items-center gap-2">
                   <Badge variant="secondary">Connected</Badge>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleDisconnect}
                     className="text-red-600 border-red-200 hover:bg-red-50"
                   >
                     <Unlink className="h-4 w-4 mr-1" />
                     Disconnect
                   </Button>
                 </div>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                 <code className="text-sm font-mono flex-1">
                   {walletData.address}
                 </code>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={copyAddress}
                 >
                   <Copy className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={viewOnTonviewer}
                 >
                   <ExternalLink className="h-4 w-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>

          {/* Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Available Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* USDT Balance - Prominent */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700">
                    {walletData.isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      `${walletData.usdtBalance} USDT`
                    )}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    = ${(parseFloat(walletData.usdtBalance) * 1).toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* TON Balance */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {walletData.isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      `${walletData.balance} TON`
                    )}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Gas fees & transactions
                  </div>
                </div>
              </div>

              {/* Convert Button */}
              <Button className="w-full" variant="outline">
                Convert USDT → TON
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-16" variant="outline">
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </Button>
                <Button className="h-16" variant="outline">
                  <QrCode className="h-5 w-5 mr-2" />
                  Receive
                </Button>
              </div>
            </CardContent>
          </Card>

                     {/* Error Display */}
           {walletData.error && (
             <Card className="border-red-200">
               <CardContent className="pt-6">
                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-red-600">
                     <AlertCircle className="h-4 w-4" />
                     <span className="text-sm">{walletData.error}</span>
                   </div>
                   {walletData.error.includes('Maximum retry attempts reached') && (
                     <Button
                       onClick={() => {
                         setRetryCount(0);
                         setWalletData(prev => ({ ...prev, error: null }));
                         connectWallet();
                       }}
                       variant="outline"
                       size="sm"
                       className="text-blue-600 border-blue-200 hover:bg-blue-50"
                     >
                       Try Again
                     </Button>
                   )}
                 </div>
               </CardContent>
             </Card>
           )}
        </div>
      )}
    </div>
  );
};

export default TonkeeperWallet;
