import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { EmbeddedWallet } from './EmbeddedWallet';

export const EnhancedWalletIntegration: React.FC = () => {

  return (
    <div className="space-y-6">
      {/* Wallet Integration */}
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
    </div>
  );
};
