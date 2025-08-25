import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Bot, 
  ExternalLink, 
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { walletBridgeService } from '@/services/walletBridgeService';
import { EmbeddedWallet } from './EmbeddedWallet';

export const EnhancedWalletIntegration: React.FC = () => {
  const { isTelegramApp } = useTelegram();
  const [activeTab, setActiveTab] = useState<'native' | 'bot' | 'bridge'>('native');
  const [walletBotInfo, setWalletBotInfo] = useState(walletBridgeService.getWalletBotInfo());

  // Update wallet bot info when component mounts
  useEffect(() => {
    setWalletBotInfo(walletBridgeService.getWalletBotInfo());
  }, []);

  const handleQuickAction = (action: 'send' | 'receive' | 'history' | 'settings') => {
    walletBridgeService.openWalletWithAction(action);
  };

  const handleOpenWalletBot = () => {
    walletBridgeService.openWallet();
  };

  const handleShowWalletOptions = () => {
    walletBridgeService.showWalletOptions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">TON Wallet Integration</h2>
        <p className="text-gray-600">
          Choose your preferred way to manage your TON wallet
        </p>
      </div>

      {/* Integration Options */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="native" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Native
          </TabsTrigger>
          <TabsTrigger value="bot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            @wallet Bot
          </TabsTrigger>
          <TabsTrigger value="bridge" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bridge
          </TabsTrigger>
        </TabsList>

        {/* Native Wallet Tab */}
        <TabsContent value="native" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Native TON Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Built-in Security</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Manage your wallet directly within this app using TON Connect v2
                  </p>
                </div>
                
                <EmbeddedWallet />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* @wallet Bot Tab */}
        <TabsContent value="bot" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Official @wallet Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Bot Status */}
                <div className={`p-4 rounded-lg border ${
                  walletBotInfo.available 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      walletBotInfo.available ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium">
                      {walletBotInfo.available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {walletBotInfo.available 
                      ? 'Official Telegram TON wallet bot is accessible'
                      : 'Running outside Telegram environment'
                    }
                  </p>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-3">@wallet Bot Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {walletBotInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-purple-800">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleQuickAction('send')}
                      disabled={!walletBotInfo.available}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                    >
                      <span className="text-lg">💰</span>
                      <span className="text-sm">Send TON</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickAction('receive')}
                      disabled={!walletBotInfo.available}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                    >
                      <span className="text-lg">📥</span>
                      <span className="text-sm">Receive TON</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickAction('history')}
                      disabled={!walletBotInfo.available}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                    >
                      <span className="text-lg">📊</span>
                      <span className="text-sm">History</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleQuickAction('settings')}
                      disabled={!walletBotInfo.available}
                      className="h-auto py-3 flex flex-col items-center gap-2"
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="text-sm">Settings</span>
                    </Button>
                  </div>
                </div>

                {/* Open Bot Button */}
                <div className="text-center">
                  <Button
                    onClick={handleOpenWalletBot}
                    disabled={!walletBotInfo.available}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Open @wallet Bot
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {!walletBotInfo.available && (
                    <p className="text-sm text-gray-500 mt-2">
                      Open in Telegram to access @wallet bot
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bridge Tab */}
        <TabsContent value="bridge" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Smart Bridge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Bridge Description */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-orange-900">Best of Both Worlds</h4>
                  </div>
                  <p className="text-sm text-orange-700">
                    Seamlessly switch between native wallet and @wallet bot based on your needs
                  </p>
                </div>

                {/* Smart Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium">Smart Recommendations</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Quick Transactions</p>
                        <p className="text-xs text-gray-500">Use @wallet bot for fast send/receive</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAction('send')}
                        disabled={!walletBotInfo.available}
                      >
                        Try
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Shield className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Advanced Management</p>
                        <p className="text-xs text-gray-500">Use native wallet for detailed control</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('native')}
                      >
                        Switch
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bridge Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium">Bridge Actions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleShowWalletOptions}
                      disabled={!walletBotInfo.available}
                      className="justify-start h-auto py-3"
                    >
                      <Bot className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Show All @wallet Options</p>
                        <p className="text-sm text-gray-500">Choose from multiple wallet actions</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('native')}
                      className="justify-start h-auto py-3"
                    >
                      <Wallet className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Switch to Native Wallet</p>
                        <p className="text-sm text-gray-500">Use built-in wallet functionality</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                </div>

                {/* Integration Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Integration Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Native Wallet</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">@wallet Bot</span>
                      <Badge 
                        variant="secondary" 
                        className={walletBotInfo.available 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-600"
                        }
                      >
                        {walletBotInfo.available ? 'Available' : 'Not Available'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bridge Mode</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>
          {isTelegramApp 
            ? 'Running in Telegram Mini App - Full @wallet bot integration available'
            : 'Running in web browser - Limited @wallet bot functionality'
          }
        </p>
        <p className="mt-1">
          For the best experience, open this app in Telegram
        </p>
      </div>
    </div>
  );
};
