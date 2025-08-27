import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/contexts/TelegramContext';
import { Bot, Smartphone, Globe } from 'lucide-react';

export const TelegramAppLauncher: React.FC = () => {
  const { isTelegramApp, isInitialized } = useTelegram();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isTelegramApp) {
    return null; // Don't show launcher when running in Telegram
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Taskquer Mini App
          </CardTitle>
          <CardDescription className="text-gray-600">
            Access this app through Telegram for the best experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Telegram Mini App</div>
                <div className="text-gray-600">Run natively in Telegram</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Globe className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Web Version</div>
                <div className="text-gray-600">Access from any browser</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Open in Telegram if possible
                const telegramUrl = `https://t.me/TaskquerBot`;
                window.open(telegramUrl, '_blank');
              }}
            >
              <Bot className="h-4 w-4 mr-2" />
              Open in Telegram
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Continue with web version
                window.location.reload();
              }}
            >
              Continue with Web Version
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Telegram Mini App provides better integration, user authentication, and payment features.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
