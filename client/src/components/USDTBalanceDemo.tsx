import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { tonWalletService } from '@/services/tonWalletService';
import { toast } from '@/hooks/use-toast';

export const USDTBalanceDemo: React.FC = () => {
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [tonBalance, setTonBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      // Get comprehensive wallet balances
      const balances = await tonWalletService.getWalletBalances();
      
      setUsdtBalance(balances.tokens.USDT?.balance || '0.00');
      setTonBalance(balances.ton);
      setLastUpdated(new Date());
      
      toast({
        title: "Balances Updated",
        description: `TON: ${balances.ton}, USDT: ${balances.tokens.USDT?.balance || '0.00'}`,
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch balances. Please check your wallet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = () => {
    const interval = tonWalletService.startBalanceMonitoring(15000); // Every 15 seconds
    if (interval) {
      setIsMonitoring(true);
      toast({
        title: "Real-time Monitoring Started",
        description: "USDT and TON balances will update every 15 seconds",
      });
    }
  };

  const stopMonitoring = () => {
    tonWalletService.stopBalanceMonitoring();
    setIsMonitoring(false);
    toast({
      title: "Monitoring Stopped",
      description: "Real-time balance updates have been disabled",
    });
  };

  const getRealTimeUSDT = async () => {
    try {
      const balance = await tonWalletService.getRealTimeUSDTBalance();
      setUsdtBalance(balance);
      setLastUpdated(new Date());
      toast({
        title: "Real-time USDT Balance",
        description: `Current USDT: ${balance}`,
      });
    } catch (error) {
      console.error('Error getting real-time USDT:', error);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchBalances();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          USDT Balance Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">USDT Balance</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Real-time
              </Badge>
            </div>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {usdtBalance} USDT
            </p>
            <p className="text-sm text-green-600 mt-1">
              ≈ ${parseFloat(usdtBalance).toFixed(2)} USD
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">TON Balance</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Gas Token
              </Badge>
            </div>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {tonBalance} TON
            </p>
            <p className="text-sm text-blue-600 mt-1">
              ≈ ${(parseFloat(tonBalance) * 2.5).toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={fetchBalances}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Balances
          </Button>

          <Button
            onClick={getRealTimeUSDT}
            className="w-full"
            variant="outline"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Get Real-time USDT
          </Button>

          <Button
            onClick={async () => {
              try {
                const debugResult = await tonWalletService.debugUSDTBalance();
                if (debugResult.success) {
                  toast({
                    title: "Debug Successful",
                    description: `USDT Balance: ${debugResult.details.fetchedUSDTBalance}`,
                  });
                  console.log('Debug details:', debugResult.details);
                } else {
                  toast({
                    title: "Debug Failed",
                    description: debugResult.error || "Unknown error",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Debug error:', error);
              }
            }}
            className="w-full"
            variant="outline"
          >
            🐛 Debug USDT Balance
          </Button>

          {!isMonitoring ? (
            <Button
              onClick={startMonitoring}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Start Real-time Monitoring
            </Button>
          ) : (
            <Button
              onClick={stopMonitoring}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Stop Monitoring
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
