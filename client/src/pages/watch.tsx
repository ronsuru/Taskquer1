import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Wallet, 
  Coins, 
  Activity,
  Search,
  QrCode,
  History,
  Settings,
  Plus,
  X
} from "lucide-react";
import { useTelegram } from "@/contexts/TelegramContext";
import { toast } from "@/hooks/use-toast";
import { watchWalletService, type WatchWalletData, type Transaction } from "@/services/watchWalletService";

export default function WatchPage() {
  const { user: telegramUser, isTelegramApp } = useTelegram();
  const [walletAddress, setWalletAddress] = useState('');
  const [watchedWallets, setWatchedWallets] = useState<WatchWalletData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveSection] = useState('overview');
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);

  // Load watched wallets and recent addresses
  useEffect(() => {
    loadWatchedWallets();
    loadRecentAddresses();
  }, []);

  const loadWatchedWallets = () => {
    const wallets = watchWalletService.getWatchedWallets();
    setWatchedWallets(wallets);
  };

  const loadRecentAddresses = () => {
    const recent = watchWalletService.getRecentAddresses();
    setRecentAddresses(recent);
  };

  const validateTONAddress = (address: string): boolean => {
    return /^EQ[a-zA-Z0-9]{48}$/.test(address);
  };

  const watchWallet = async (address: string) => {
    if (!validateTONAddress(address)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid TON wallet address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await watchWalletService.addWalletToWatch(address);
      watchWalletService.addToRecentAddresses(address);
      
      // Reload data
      loadWatchedWallets();
      loadRecentAddresses();
      
      // Clear input
      setWalletAddress('');
      
      toast({
        title: "Wallet Added",
        description: "Now watching wallet: " + address.slice(0, 8) + "...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to watch wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeWallet = (address: string) => {
    watchWalletService.removeWalletFromWatch(address);
    loadWatchedWallets();
    
    toast({
      title: "Wallet Removed",
      description: "Wallet is no longer being watched",
    });
  };

  const refreshWallet = async (address: string) => {
    try {
      await watchWalletService.refreshWalletData(address);
      loadWatchedWallets();
      
      toast({
        title: "Refreshed",
        description: "Wallet data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh wallet data",
        variant: "destructive",
      });
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
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

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Eye className="w-8 h-8 text-blue-600" />
            Watch Wallet
          </h1>
          <p className="text-gray-600">
            Monitor TON wallets without connecting your own wallet
          </p>
        </div>

        {/* Add Wallet Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Add Wallet to Watch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter TON wallet address (EQ...)"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => watchWallet(walletAddress)}
                disabled={isLoading || !walletAddress.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Watch
              </Button>
            </div>

            {/* Recent Addresses */}
            {recentAddresses.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Recent addresses:</p>
                <div className="flex flex-wrap gap-2">
                  {recentAddresses.map((address, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWalletAddress(address);
                        watchWallet(address);
                      }}
                      className="text-xs"
                    >
                      {formatAddress(address)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watched Wallets */}
        {watchedWallets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Watched Wallets</h2>
            
            {watchedWallets.map((wallet) => (
              <Card key={wallet.address} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatAddress(wallet.address)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Last updated: {formatTimeAgo(wallet.lastUpdated)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshWallet(wallet.address)}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWallet(wallet.address)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Stop
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Coins className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">TON Balance</p>
                      <p className="text-xl font-bold text-gray-900">
                        {wallet.balance} TON
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">USDT Balance</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${wallet.usdtBalance}
                      </p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <History className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-xl font-bold text-gray-900">
                        {wallet.transactions.length}
                      </p>
                    </div>
                  </div>

                  {/* Wallet Details Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveSection}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                      <TabsTrigger value="tokens">Tokens</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Wallet Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Address:</span>
                              <span className="font-mono text-xs">{wallet.address}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total transactions:</span>
                              <span>{wallet.transactions.length}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => openInExplorer(wallet.address)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on TONScan
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => copyAddress(wallet.address)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Address
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Recent Transactions</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {wallet.transactions.map((tx, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  tx.type === 'in' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <div>
                                  <p className="text-sm font-medium">
                                    {tx.type === 'in' ? 'Received' : 'Sent'} {tx.amount} TON
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatTimeAgo(tx.timestamp)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono text-gray-600">
                                  {tx.hash.slice(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500">
                                  Fee: {tx.fee} TON
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="tokens" className="space-y-4">
                      <div className="text-center py-8 text-gray-500">
                        <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Token information will be displayed here</p>
                        <p className="text-sm">Coming soon...</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Analytics and charts will be displayed here</p>
                        <p className="text-sm">Coming soon...</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {watchedWallets.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Wallets Being Watched
              </h3>
              <p className="text-gray-600 mb-6">
                Enter a TON wallet address above to start monitoring it
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <QrCode className="w-4 h-4" />
                <span>You can also scan QR codes from other apps</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
