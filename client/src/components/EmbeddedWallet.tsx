import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Send, 
  Download, 
  History, 
  Copy, 
  ExternalLink,
  QrCode,
  Settings,
  RefreshCw
} from 'lucide-react';
import { tonWalletService, TONTransaction } from '@/services/tonWalletService';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from '@/hooks/use-toast';

// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openTelegramLink: (url: string) => void;
        showPopup: (options: any) => void;
        onEvent: (event: string, callback: (data: any) => void) => void;
      };
    };
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  transactions: TONTransaction[];
  isLoading: boolean;
  tokens?: { [symbol: string]: { balance: string; decimals: number; contractAddress?: string } };
  lastUpdated?: number;
}

export const EmbeddedWallet: React.FC = () => {
  const { isTelegramApp } = useTelegram();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: '0.00',
    transactions: [],
    isLoading: false
  });
  
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [selectedToken, setSelectedToken] = useState('TON');

  // Initialize wallet state - only run once on mount
  useEffect(() => {
    // Only check wallet status if we haven't already done so
    if (!hasInitialized && !walletState.isConnected && !isRestoring) {
      console.log('🔧 Initializing wallet state...');
      setHasInitialized(true);
      checkWalletStatus();
    } else {
      console.log('🔧 Wallet already initialized or connected, skipping initialization');
    }
  }, [hasInitialized]); // Remove other dependencies to prevent re-runs

  // Listen for wallet connection changes
  useEffect(() => {
    if (walletState.isConnected) {
      loadWalletData();
      
      // Start real-time balance monitoring
      const interval = tonWalletService.startBalanceMonitoring(30000); // Update every 30 seconds
      
      // Cleanup function to stop monitoring when component unmounts or wallet disconnects
      return () => {
        if (interval) {
          tonWalletService.stopBalanceMonitoring();
        }
      };
    }
  }, [walletState.isConnected]);

  const checkWalletStatus = async () => {
    try {
      // Check if wallet is already connected (this will include restored data from localStorage)
      const walletData = tonWalletService.getWalletData();
      if (walletData?.isConnected) {
        console.log('Found existing wallet connection:', walletData);
        setIsRestoring(true);
        
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: walletData.address,
          balance: walletData.balance || '0.00',
          tokens: walletData.tokens
        }));
        
        // If we have a real address (not "Integrated Wallet"), try to refresh the data
        if (walletData.address && walletData.address !== 'Integrated Wallet') {
          console.log('Refreshing real wallet data...');
          try {
            const [realBalance, tokens] = await Promise.all([
              tonWalletService.getRealBalance(walletData.address),
              tonWalletService.getAllTokenBalances(walletData.address)
            ]);
            
            // Update with fresh data
            tonWalletService.setWalletData(walletData.address, realBalance, tokens);
            
            setWalletState(prev => ({
              ...prev,
              balance: realBalance,
              tokens
            }));
          } catch (refreshError) {
            console.log('Could not refresh wallet data, using cached data:', refreshError);
          }
        }
        
        setIsRestoring(false);
      } else {
        // Check if there's a saved wallet address from Account Settings
        const savedWalletAddress = localStorage.getItem('user_wallet_address');
        if (savedWalletAddress && tonWalletService.validateTONAddress(savedWalletAddress)) {
          console.log('Found saved wallet address from Account Settings:', savedWalletAddress);
          setIsRestoring(true);
          
          try {
            // Connect to the saved wallet address
            const [realBalance, tokens] = await Promise.all([
              tonWalletService.getRealBalance(savedWalletAddress),
              tonWalletService.getAllTokenBalances(savedWalletAddress)
            ]);
            
            // Set the wallet data
            tonWalletService.setWalletData(savedWalletAddress, realBalance, tokens);
            
            setWalletState(prev => ({
              ...prev,
              isConnected: true,
              address: savedWalletAddress,
              balance: realBalance,
              tokens
            }));
            
            toast({
              title: "Wallet Auto-Connected",
              description: `Connected to your saved wallet address from Account Settings.`,
            });
          } catch (error) {
            console.error('Failed to connect to saved wallet address:', error);
            toast({
              title: "Auto-Connection Failed",
              description: "Could not connect to your saved wallet address. Please check the address in Account Settings.",
              variant: "destructive",
            });
          } finally {
            setIsRestoring(false);
          }
        } else {
          console.log('No existing wallet connection or saved address found');
        }
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setIsRestoring(false);
    }
  };

  const loadWalletData = async () => {
    if (!walletState.isConnected) return;
    
    setWalletState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Use the new comprehensive balance method
      const [walletBalances, transactions] = await Promise.all([
        tonWalletService.getWalletBalances(),
        tonWalletService.getTransactionHistory()
      ]);
      
      setWalletState(prev => ({
        ...prev,
        balance: walletBalances.ton,
        transactions,
        tokens: walletBalances.tokens,
        lastUpdated: Date.now(),
        isLoading: false
      }));
      
      console.log('✅ Wallet data loaded successfully:', {
        ton: walletBalances.ton,
        tokens: walletBalances.tokens,
        transactionCount: transactions.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConnectWallet = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('Setting up integrated wallet...');
      const success = await tonWalletService.setupIntegratedWallet();
      console.log('Integrated wallet setup result:', success);
      
      if (success) {
        // Get the wallet data immediately after setup
        const walletData = tonWalletService.getWalletData();
        console.log('Wallet data after setup:', walletData);
        
        if (walletData?.isConnected) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: walletData.address,
            balance: walletData.balance || '0.00'
          }));
          
          // Load wallet data immediately after setup
          await loadWalletData();
          
          const connectionMethod = tonWalletService.getConnectionMethod();
          toast({
            title: "Integrated Wallet Ready",
            description: `Your TON wallet is now integrated directly into the mini-app! (${connectionMethod})`,
          });
        } else {
          console.log('Wallet not connected after successful setup');
          toast({
            title: "Setup Failed",
            description: "Integrated wallet setup completed but status not updated. Please refresh and try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Integrated wallet setup returned false');
        toast({
          title: "Setup Failed",
          description: "Failed to setup integrated wallet. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Integrated wallet setup error:', error);
      toast({
        title: "Setup Error",
        description: error instanceof Error ? error.message : "An error occurred while setting up your integrated wallet.",
        variant: "destructive",
      });
    } finally {
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await tonWalletService.disconnectWallet();
      setWalletState({
        isConnected: false,
        address: null,
        balance: '0.00',
        transactions: [],
        isLoading: false
      });
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  };

  const handleSendTON = async () => {
    if (!sendAmount || !sendAddress) {
      toast({
        title: "Invalid Input",
        description: "Please enter both amount and recipient address.",
        variant: "destructive",
      });
      return;
    }

    if (!tonWalletService.validateTONAddress(sendAddress)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TON wallet address.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough balance
    const availableBalance = walletState.tokens?.[selectedToken]?.balance || '0';
    if (parseFloat(sendAmount) > parseFloat(availableBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${availableBalance} ${selectedToken} available.`,
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      let result;
      
      if (selectedToken === 'TON') {
        // Send TON using existing method
        result = await tonWalletService.sendTON({
          amount: sendAmount,
          recipientAddress: sendAddress,
          memo: sendMemo
        });
      } else {
        // For other tokens, show a message (you can implement actual token sending later)
        toast({
          title: "Token Sending",
          description: `Sending ${selectedToken} is not yet implemented. This will be added in a future update.`,
        });
        setShowSendDialog(false);
        setSendAmount('');
        setSendAddress('');
        setSendMemo('');
        setIsSending(false);
        return;
      }

      if (result?.success) {
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${sendAmount} ${selectedToken}`,
        });
        setShowSendDialog(false);
        setSendAmount('');
        setSendAddress('');
        setSendMemo('');
        loadWalletData(); // Refresh wallet data
      } else {
        toast({
          title: "Transaction Failed",
          description: result?.error || "Failed to send transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      toast({
        title: "Transaction Error",
        description: "An error occurred while sending the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const openInExplorer = (address: string) => {
    window.open(`https://tonscan.org/address/${address}`, '_blank');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getAddressFormat = (address: string): string => {
    if (address.startsWith('EQ')) return 'EQ (External Query - Workchain 0)';
    if (address.startsWith('UQ')) return 'UQ (User Query - Workchain 0)';
    if (address.startsWith('0:0:')) return '0:0: (Raw - Workchain 0, Non-bounceable)';
    if (address.startsWith('0:1:')) return '0:1: (Raw - Workchain 0, Bounceable)';
    if (address.startsWith('-1:')) return '-1: (Raw - Workchain -1)';
    if (address.includes(':')) return 'Raw Format (Workchain:Address)';
    return 'Unknown Format';
  };

  if (!walletState.isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Connect your TON wallet to manage your funds, send transactions, and view your balance.
          </p>
          
          {/* Wallet Address Input for Real TON Address */}
          <div className="mt-4 space-y-3">
            {/* Check if there's a saved wallet address */}
            {(() => {
              const savedAddress = localStorage.getItem('user_wallet_address');
              if (savedAddress) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Tip:</strong> You have a wallet address saved in Account Settings. 
                      The wallet will automatically connect to it when you open the mini-app.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="text-xs text-gray-500">
              <p className="mb-2">Have a TON wallet address? Enter it below:</p>
              <p className="mb-2">
                Supported formats: EQ..., UQ..., 0:0:..., -1:..., etc.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your TON wallet address (EQ..., UQ..., etc.)"
                  value={walletAddressInput}
                  onChange={(e) => setWalletAddressInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Clear the input field
                    setWalletAddressInput('');
                  }}
                  title="Clear address field"
                >
                  Clear
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('Attempting to connect real wallet with address:', walletAddressInput);
                  
                  if (!walletAddressInput) {
                    toast({
                      title: "No Address",
                      description: "Please enter a TON wallet address",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Validate the address
                  console.log('=== ADDRESS VALIDATION DEBUG ===');
                  console.log('Address:', walletAddressInput);
                  console.log('Address length:', walletAddressInput.length);
                  console.log('Address format:', getAddressFormat(walletAddressInput));
                  console.log('Starts with UQ:', walletAddressInput.startsWith('UQ'));
                  console.log('Starts with EQ:', walletAddressInput.startsWith('EQ'));
                  console.log('Contains colon:', walletAddressInput.includes(':'));
                  
                  const isValid = tonWalletService.validateTONAddress(walletAddressInput);
                  console.log('Address validation result:', isValid);
                  console.log('=== END DEBUG ===');
                  
                  if (isValid) {
                    try {
                      console.log('Address is valid, fetching real balance and tokens...');
                      // Update wallet with real address
                      tonWalletService.setWalletData(walletAddressInput, '0.00');
                      
                      // Fetch both balance and tokens
                      const [realBalance, tokens] = await Promise.all([
                        tonWalletService.getRealBalance(walletAddressInput),
                        tonWalletService.getAllTokenBalances(walletAddressInput)
                      ]);
                      
                      console.log('Real balance fetched:', realBalance);
                      console.log('Tokens fetched:', tokens);
                      
                      // Update wallet data with tokens
                      tonWalletService.setWalletData(walletAddressInput, realBalance, tokens);
                      
                      // Update UI state
                      setWalletState(prev => ({
                        ...prev,
                        isConnected: true,
                        address: walletAddressInput,
                        balance: realBalance,
                        tokens
                      }));
                      
                      const tokenCount = Object.keys(tokens).length;
                      toast({
                        title: "Real Wallet Connected",
                        description: `Connected to real TON wallet with ${tokenCount} tokens including ${realBalance} TON`,
                      });
                    } catch (error) {
                      console.error('Error fetching real balance:', error);
                      toast({
                        title: "Error",
                        description: "Failed to fetch wallet data. Using integrated mode.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    console.log('Address validation failed for:', walletAddressInput);
                    toast({
                      title: "Invalid Address",
                      description: `Invalid TON address format. Address should start with "EQ", "UQ", "0:0:", "-1:", or similar prefixes and contain 40-60 alphanumeric characters.`,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Connect Wallet
              </Button>
            </div>
          </div>
          
          {isTelegramApp && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Or if you don't have TON wallet:</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (window.Telegram?.WebApp) {
                    window.Telegram.WebApp.openTelegramLink('https://t.me/wallet?start=taskquer');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open @wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Restoration Loading Indicator - Only show if actually restoring */}
        {isRestoring && !walletState.isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-600">Restoring your wallet...</p>
            </div>
          </div>
        )}
        
        {/* Balance Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <p className="text-lg font-semibold text-gray-800">Available Balances</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (walletState.address) {
                    setWalletState(prev => ({ ...prev, isLoading: true }));
                    try {
                      const [realBalance, tokens] = await Promise.all([
                        tonWalletService.getRealBalance(walletState.address),
                        tonWalletService.getAllTokenBalances(walletState.address)
                      ]);
                      
                      tonWalletService.setWalletData(walletState.address, realBalance, tokens);
                      
                      setWalletState(prev => ({
                        ...prev,
                        balance: realBalance,
                        tokens,
                        isLoading: false
                      }));
                      
                      toast({
                        title: "Balances Refreshed",
                        description: "Wallet balances have been updated with latest data.",
                      });
                    } catch (error) {
                      console.error('Error refreshing balances:', error);
                      toast({
                        title: "Refresh Failed",
                        description: "Could not refresh wallet balances. Please try again.",
                        variant: "destructive",
                      });
                      setWalletState(prev => ({ ...prev, isLoading: false }));
                    }
                  }
                }}
                disabled={walletState.isLoading}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="Refresh wallet balances"
              >
                <RefreshCw className={`h-3 w-3 ${walletState.isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {/* Main USDT Balance - Prominently Displayed */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-green-600">
                {(() => {
                  const usdtBalance = walletState.tokens?.USDT?.balance || '0.00';
                  return formatAmount(usdtBalance);
                })()} USDT
              </p>
              <p className="text-lg text-gray-600 mt-2">
                = ${(() => {
                  const usdtBalance = walletState.tokens?.USDT?.balance || '0.00';
                  return parseFloat(usdtBalance).toFixed(2);
                })()} USD
              </p>
            </div>
            
            {/* TON and USDT Balance Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* TON Balance Box */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <p className="text-2xl font-bold text-blue-600">
                  {formatAmount(walletState.balance)} $TON
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ≈ ${(parseFloat(walletState.balance) * 2.5).toFixed(2)} USD
                </p>
              </div>
              
              {/* USDT Balance Box */}
              <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(walletState.tokens?.USDT?.balance || '0.00')} $USDT
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ≈ ${(parseFloat(walletState.tokens?.USDT?.balance || '0.00')).toFixed(2)} USD
                </p>
              </div>
            </div>
            
            {/* Convert Token Button */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 flex items-center justify-center mb-4">
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:text-white hover:bg-white/20 font-semibold text-lg px-6 py-3"
                onClick={() => {
                  toast({
                    title: "Token Swap",
                    description: "Swap USDT to TON for gas fees. This feature will be implemented soon!",
                  });
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">Convert</span>
                  <span className="text-xs opacity-90">USDT → TON</span>
                </div>
              </Button>
            </div>
            
            {/* Other Token Balances (if any) */}
            {walletState.tokens && Object.keys(walletState.tokens).length > 2 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Other Tokens</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(walletState.tokens).map(([symbol, tokenData]) => {
                    if (symbol === 'TON' || symbol === 'USDT') return null; // Skip TON and USDT as they're shown above
                    return (
                      <div key={symbol} className="bg-white/50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatAmount(tokenData.balance)} {symbol}
                        </p>
                        <p className="text-xs text-gray-600">
                          {symbol === 'USDT' ? '≈ $' + parseFloat(tokenData.balance).toFixed(2) : 'Token Balance'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Address Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">Wallet Address</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(walletState.address!)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInExplorer(walletState.address!)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Wallet Address Display */}
          <p className="font-mono text-sm bg-white p-3 rounded border mb-4">
            {formatAddress(walletState.address!)}
          </p>
          
          {/* Send and Receive Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  SEND
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send {selectedToken}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token">Select Token</Label>
                    <select
                      id="token"
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {walletState.tokens && Object.keys(walletState.tokens).map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol} - {formatAmount(walletState.tokens![symbol].balance)} available
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount ({selectedToken})</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      step={selectedToken === 'USDT' ? '0.01' : '0.001'}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {walletState.tokens?.[selectedToken]?.balance || '0.00'} {selectedToken}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="address">Recipient Address</Label>
                    <Input
                      id="address"
                      placeholder="EQ..."
                      value={sendAddress}
                      onChange={(e) => setSendAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="memo">Memo (Optional)</Label>
                    <Input
                      id="memo"
                      placeholder="Transaction description"
                      value={sendMemo}
                      onChange={(e) => setSendMemo(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSendTON}
                    disabled={isSending || !sendAmount || !sendAddress}
                    className="w-full"
                  >
                    {isSending ? 'Sending...' : `Send ${selectedToken}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  RECEIVE
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Receive TON</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <QrCode className="h-32 w-32 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Your TON Wallet Address</p>
                    <p className="font-mono text-sm break-all bg-white p-2 rounded border">
                      {walletState.address}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(walletState.address!)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Real-time Status and Transactions Section */}
        <div className="w-full">
          {/* Real-time Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700">Real-time Monitoring Active</span>
              </div>
              <div className="text-xs text-blue-600">
                Updates every 30s • Last: {walletState.lastUpdated ? 
                  new Date(walletState.lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recent Transactions</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadWalletData}
              disabled={walletState.isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${walletState.isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {walletState.isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading transactions...</p>
            </div>
          ) : walletState.transactions.length > 0 ? (
            <div className="space-y-2">
              {walletState.transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'receive' ? (
                        <Download className="h-4 w-4 text-green-600" />
                      ) : (
                        <Send className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.type === 'receive' ? 'Received' : 'Sent'}
                      </p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${
                      tx.type === 'receive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'receive' ? '+' : '-'}{formatAmount(tx.amount)} TON
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.status === 'completed' ? 'Completed' : tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              onClick={handleDisconnectWallet}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                tonWalletService.clearSavedWalletData();
                toast({
                  title: "Wallet Data Cleared",
                  description: "Your saved wallet data has been cleared. You'll need to reconnect next time.",
                });
              }}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Forget Wallet (Clear Saved Data)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

