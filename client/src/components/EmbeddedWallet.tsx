import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Send, 
  Download, 
  History, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  QrCode,
  Settings
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
  
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Initialize wallet state
  useEffect(() => {
    checkWalletStatus();
  }, []);

  // Listen for wallet connection changes
  useEffect(() => {
    if (walletState.isConnected) {
      loadWalletData();
    }
  }, [walletState.isConnected]);

  const checkWalletStatus = async () => {
    try {
      // Try to restore connection first
      const isRestored = await tonWalletService.refreshConnectionStatus();
      if (isRestored) {
        const walletData = tonWalletService.getWalletData();
        if (walletData?.isConnected) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: walletData.address,
            balance: walletData.balance
          }));
        }
      } else {
        // Check if wallet is already connected
        const walletData = tonWalletService.getWalletData();
        if (walletData?.isConnected) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: walletData.address,
            balance: walletData.balance
          }));
        }
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    }
  };

  const loadWalletData = async () => {
    if (!walletState.isConnected) return;
    
    setWalletState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [balance, transactions] = await Promise.all([
        tonWalletService.getBalance(),
        tonWalletService.getTransactionHistory()
      ]);
      
      setWalletState(prev => ({
        ...prev,
        balance,
        transactions,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConnectWallet = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const success = await tonWalletService.connectWallet();
      if (success) {
        // Wait a bit for the connection to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check the wallet status again
        const walletData = tonWalletService.getWalletData();
        if (walletData?.isConnected) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: walletData.address,
            balance: walletData.balance || '0.00'
          }));
          
          // Load wallet data immediately after connection
          await loadWalletData();
          
          toast({
            title: "Wallet Connected",
            description: "Your TON wallet has been connected successfully!",
          });
        } else {
          toast({
            title: "Connection Failed",
            description: "Failed to connect wallet. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting your wallet.",
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

    setIsSending(true);
    
    try {
      const result = await tonWalletService.sendTON({
        amount: sendAmount,
        recipientAddress: sendAddress,
        memo: sendMemo
      });

      if (result.success) {
        toast({
          title: "Transaction Sent",
          description: `Successfully sent ${sendAmount} TON`,
        });
        setShowSendDialog(false);
        setSendAmount('');
        setSendAddress('');
        setSendMemo('');
        loadWalletData(); // Refresh wallet data
      } else {
        toast({
          title: "Transaction Failed",
          description: result.error || "Failed to send transaction",
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

  if (!walletState.isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            TON Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Connect your TON wallet to manage your funds, send transactions, and view your balance.
          </p>
          <Button 
            onClick={handleConnectWallet}
            disabled={walletState.isLoading}
            className="w-full max-w-xs"
          >
            {walletState.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          {isTelegramApp && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Or use the official @wallet bot:</p>
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
            TON Wallet
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Balance Display */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatAmount(walletState.balance)} TON
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ≈ ${(parseFloat(walletState.balance) * 2.5).toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
              <p className="font-mono text-sm">{formatAddress(walletState.address!)}</p>
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
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send TON</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (TON)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
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
                  {isSending ? 'Sending...' : 'Send TON'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Receive
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

        {/* Tabs for different sections */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Recent Transactions</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadWalletData}
                  disabled={walletState.isLoading}
                >
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
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Wallet Connection</p>
                  <p className="text-sm text-gray-500">TON Connect v2</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Network</p>
                  <p className="text-sm text-gray-500">TON Mainnet</p>
                </div>
                <Badge variant="outline">Mainnet</Badge>
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={handleDisconnectWallet}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="help" className="mt-4">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  If you need assistance with your TON wallet, you can:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Visit the official TON documentation</li>
                  <li>• Contact TON support</li>
                  <li>• Use the @wallet bot for advanced features</li>
                </ul>
              </div>

              {isTelegramApp && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.Telegram?.WebApp) {
                      window.Telegram.WebApp.openTelegramLink('https://t.me/wallet?start=taskquer');
                    }
                  }}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Official @wallet Bot
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};