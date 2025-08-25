import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Zap, 
  Bot, 
  Wallet, 
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { walletBridgeService } from '@/services/walletBridgeService';

export const WalletIntegrationDemo: React.FC = () => {
  const { isTelegramApp } = useTelegram();
  const [demoAmount, setDemoAmount] = useState('10.5');
  const [demoAddress, setDemoAddress] = useState('EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');
  const [lastAction, setLastAction] = useState<string>('');
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const runDemo = async (action: string) => {
    setIsDemoRunning(true);
    setLastAction(action);
    
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsDemoRunning(false);
  };

  const demoActions = [
    {
      id: 'native_connect',
      title: 'Connect Native Wallet',
      description: 'Test TON Connect v2 integration',
      icon: <Wallet className="h-5 w-5" />,
      action: () => runDemo('Native wallet connection initiated'),
      available: true
    },
    {
      id: 'bot_send',
      title: 'Send TON via @wallet',
      description: 'Deep link to @wallet bot send function',
      icon: <Bot className="h-5 w-5" />,
      action: () => {
        walletBridgeService.openWalletWithAmount(demoAmount, demoAddress);
        runDemo('@wallet bot send action initiated');
      },
      available: isTelegramApp
    },
    {
      id: 'bot_receive',
      title: 'Receive TON via @wallet',
      description: 'Deep link to @wallet bot receive function',
      icon: <Bot className="h-5 w-5" />,
      action: () => {
        walletBridgeService.openWalletWithAction('receive');
        runDemo('@wallet bot receive action initiated');
      },
      available: isTelegramApp
    },
    {
      id: 'bridge_options',
      title: 'Show Wallet Options',
      description: 'Display comprehensive wallet action menu',
      icon: <Zap className="h-5 w-5" />,
      action: () => {
        walletBridgeService.showWalletOptions();
        runDemo('Wallet options popup displayed');
      },
      available: isTelegramApp
    },
    {
      id: 'deep_link',
      title: 'Custom Deep Link',
      description: 'Test custom @wallet bot deep linking',
      icon: <ExternalLink className="h-5 w-5" />,
      action: () => {
        walletBridgeService.openWalletWithAddress(demoAddress);
        runDemo('Custom deep link initiated');
      },
      available: isTelegramApp
    }
  ];

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Play className="h-5 w-5" />
            Wallet Integration Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            Test the different wallet integration features. This demo showcases both native wallet functionality 
            and @wallet bot integration capabilities.
          </p>
          
          {/* Demo Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="demoAmount">Demo Amount (TON)</Label>
              <Input
                id="demoAmount"
                type="number"
                value={demoAmount}
                onChange={(e) => setDemoAmount(e.target.value)}
                placeholder="10.5"
                step="0.1"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="demoAddress">Demo Address</Label>
              <Input
                id="demoAddress"
                value={demoAddress}
                onChange={(e) => setDemoAddress(e.target.value)}
                placeholder="EQ..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoActions.map((demoAction) => (
          <Card key={demoAction.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {demoAction.icon}
                  <CardTitle className="text-base">{demoAction.title}</CardTitle>
                </div>
                <Badge 
                  variant={demoAction.available ? "secondary" : "outline"}
                  className={demoAction.available 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-600"
                  }
                >
                  {demoAction.available ? 'Available' : 'Not Available'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-3">
                {demoAction.description}
              </p>
              <Button
                onClick={demoAction.action}
                disabled={!demoAction.available || isDemoRunning}
                className="w-full"
                variant={demoAction.available ? "default" : "outline"}
              >
                {isDemoRunning && lastAction === demoAction.title ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Demo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Results */}
      {lastAction && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Demo Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800">{lastAction}</span>
              </div>
              
              {lastAction.includes('@wallet') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">@wallet Bot Action</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    The @wallet bot should have opened with the requested action. 
                    If you're running in Telegram, check for the bot popup or navigation.
                  </p>
                </div>
              )}
              
              {lastAction.includes('Native') && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Native Wallet Action</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Native wallet functionality has been initiated. Check the native wallet tab 
                    to see the connection process.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Native Wallet</p>
                  <p className="text-sm text-gray-500">TON Connect v2 integration</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Available
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">@wallet Bot</p>
                  <p className="text-sm text-gray-500">Telegram bot integration</p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={isTelegramApp 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-600"
                }
              >
                {isTelegramApp ? 'Available' : 'Not Available'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Bridge Mode</p>
                  <p className="text-sm text-gray-500">Smart integration switching</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">How to Use This Demo</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="space-y-2 text-sm">
            <p>1. <strong>Set Demo Parameters</strong>: Adjust the amount and address above</p>
            <p>2. <strong>Run Demo Actions</strong>: Click on different demo actions to test functionality</p>
            <p>3. <strong>Observe Results</strong>: Watch for @wallet bot popups and native wallet responses</p>
            <p>4. <strong>Check Integration</strong>: Monitor the integration status below</p>
            <p className="mt-3 text-blue-700">
              <strong>Note:</strong> @wallet bot features are only available when running in Telegram. 
              Native wallet features work in all environments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
