import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Globe } from 'lucide-react';

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  photoUrl?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TelegramUser | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  console.log("UserProfileModal render:", { isOpen, user });

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            {user.photoUrl && (
              <img 
                src={user.photoUrl} 
                alt="Profile" 
                className="w-16 h-16 rounded-full border-4 border-blue-100"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                @{user.username || 'No username'}
              </p>
              {user.isPremium && (
                <Badge variant="premium" className="mt-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>

          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">User ID:</span>
                <span className="text-sm text-muted-foreground">{user.id}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Language:</span>
                <span className="text-sm text-muted-foreground">
                  {user.languageCode ? user.languageCode.toUpperCase() : 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Simple Message */}
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-gray-600">
                TON Wallet integration coming soon! 🚀
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1">
            Edit Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
