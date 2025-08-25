import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TaskCard from "@/components/TaskCard";
import CampaignForm from "@/components/CampaignForm";
import WithdrawalForm from "@/components/WithdrawalForm";
import TaskSubmissionModal from "@/components/TaskSubmissionModal";
import AdminBalanceModal from "@/components/AdminBalanceModal";
import { User, Wallet, Trophy, CheckCircle, Search, Plus, Filter, Settings, LogOut, User as UserIcon, Cog, Download, Bell } from "lucide-react";
import type { Campaign, User as UserType, Transaction } from "@shared/schema";
import { useTelegram } from "@/contexts/TelegramContext";
import { TelegramAppLauncher } from "@/components/TelegramAppLauncher";
import { UserProfileModal } from "@/components/UserProfileModal";

export default function Dashboard() {
  const { user: telegramUser, isTelegramApp, isInitialized } = useTelegram();
  const [selectedTask, setSelectedTask] = useState<Campaign | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tonWallet' | 'browseTask' | 'transactionWithdrawal' | 'profileSettings'>('dashboard');
  
  // Use Telegram user ID if available, otherwise fallback to hardcoded ID
  const userId = telegramUser?.id?.toString() || "5154336054";

  // Handle dropdown menu actions
  const handleProfileClick = () => {
    console.log("Profile button clicked!");
    console.log("Current showProfile state:", showProfile);
    setShowProfile(true);
    console.log("Setting showProfile to true");
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    // You can add settings modal logic here
    console.log("Settings clicked for user:", telegramUser?.firstName);
  };

  const handleLogoutClick = () => {
    // You can add logout logic here
    console.log("Logout clicked for user:", telegramUser?.firstName);
    // For now, just show an alert
    alert("Logout functionality coming soon!");
  };

  // Fetch user data
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Debug logging - Remove after testing
  useEffect(() => {
    console.log("=== DEBUG INFO ===");
    console.log("Telegram User:", telegramUser);
    console.log("User ID:", userId);
    console.log("User data:", user);
    console.log("User telegramId:", user?.telegramId);
    console.log("User isAdmin:", user?.isAdmin);
    console.log("Hardcoded admin check:", user?.telegramId === "5154336054");
    console.log("Combined admin check:", user?.isAdmin || user?.telegramId === "5154336054");
    console.log("==================");
  }, [user, telegramUser, userId]);

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", platformFilter],
    enabled: true,
  });

  // Fetch user transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/users", userId, "transactions"],
    enabled: !!userId,
  });

  const platformIcons = {
    twitter: "fab fa-twitter",
    tiktok: "fab fa-tiktok", 
    facebook: "fab fa-facebook",
    telegram: "fab fa-telegram"
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    platformFilter === "all" || campaign.platform === platformFilter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Show Telegram app launcher if not running in Telegram
  if (!isTelegramApp && isInitialized) {
    return <TelegramAppLauncher />;
  }

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-slate-50 mini-app-container telegram-mini-app">
      {/* Header Section */}
      <div className="bg-white px-4 py-6 border-b border-slate-200">
        <div className="flex justify-between items-start">
          {/* Greetings */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Hi {telegramUser?.firstName || 'User'} 👋
            </h1>
            <p className="text-slate-600 mt-1">Welcome back to Taskquer</p>
          </div>
          
          {/* Profile Picture */}
          <div className="flex items-center space-x-3">
            {telegramUser?.photoUrl && (
              <img 
                src={telegramUser.photoUrl} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-blue-100"
              />
            )}
            {/* Admin Badge */}
            {(user?.isAdmin || user?.telegramId === "5154336054" || telegramUser?.id === 5154336054) && (
              <Badge variant="premium" className="text-xs">
                ADMIN
              </Badge>
            )}
          </div>
        </div>
        
        {/* Task Counts */}
        <div className="flex space-x-6 mt-6">
          {/* Total Finished Tasks */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {user?.completedTasks || 0}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Total Task Completed
            </div>
          </div>
          
          {/* Ongoing Tasks */}
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {user?.ongoingTasks || 0}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              Ongoing Task
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 mini-app-content">

        {/* Main Content */}
        <div className="space-y-6">

          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Balance</p>
                          <p className="text-xl font-bold text-blue-900">{user?.balance || "0.00"} USDT</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Total Rewards</p>
                          <p className="text-xl font-bold text-green-900">{user?.rewards || "0.00"} USDT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white">
                    <h3 className="font-semibold mb-2">Ready to earn?</h3>
                    <p className="text-blue-100 text-sm">Browse available tasks and start earning USDT rewards!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TON Wallet Section */}
          {activeSection === 'tonWallet' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>TON Wallet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg text-white text-center">
                    <h3 className="text-xl font-bold mb-2">TON Wallet Integration</h3>
                    <p className="text-orange-100">Connect your TON wallet to manage your crypto assets</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button className="w-full" variant="outline">
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Send/Receive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Browse Tasks Section */}
          {activeSection === 'browseTask' && (
            <div className="space-y-6">
              {/* Platform Filter */}
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filter by Platform:</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Button 
                  variant={platformFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("all")}
                >
                  All Platforms
                </Button>
                {["twitter", "tiktok", "facebook", "telegram"].map((platform) => (
                  <Button
                    key={platform}
                    variant={platformFilter === platform ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatformFilter(platform)}
                    className="capitalize"
                  >
                    <i className={`${platformIcons[platform as keyof typeof platformIcons]} mr-2`} />
                    {platform}
                  </Button>
                ))}
              </div>

              {/* Task Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <TaskCard
                    key={campaign.id}
                    campaign={campaign}
                    onStartTask={() => setSelectedTask(campaign)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Transactions & Withdrawal Section */}
          {activeSection === 'transactionWithdrawal' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "reward" ? "bg-success-green bg-opacity-10" :
                          transaction.type === "withdrawal" ? "bg-error-red bg-opacity-10" : 
                          "bg-telegram-blue bg-opacity-10"
                        }`}>
                          {transaction.type === "reward" && <Plus className="w-5 h-5 text-success-green" />}
                          {transaction.type === "withdrawal" && <Wallet className="w-5 h-5 text-error-red" />}
                          {transaction.type === "deposit" && <Plus className="w-5 h-5 text-telegram-blue" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {transaction.type === "reward" ? "Task Reward" : 
                             transaction.type === "withdrawal" ? "Withdrawal" : "Deposit"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt.toString())}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === "withdrawal" ? "text-error-red" : "text-success-green"
                        }`}>
                          {transaction.type === "withdrawal" ? "-" : "+"}
                          {transaction.amount} USDT
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  <WithdrawalForm userId={userId} userBalance={user?.balance || "0"} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile & Settings Section */}
          {activeSection === 'profileSettings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {telegramUser?.photoUrl && (
                      <img 
                        src={telegramUser.photoUrl} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full border-4 border-blue-100"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {telegramUser?.firstName} {telegramUser?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{telegramUser?.username || 'No username'}
                      </p>
                      {telegramUser?.isPremium && (
                        <Badge variant="premium" className="mt-1">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                   
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">User ID:</span>
                      <span className="text-sm text-muted-foreground">{telegramUser?.id}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Language:</span>
                      <span className="text-sm text-muted-foreground">
                        {telegramUser?.languageCode ? telegramUser.languageCode.toUpperCase() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notification Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 mini-app-bottom-nav">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {/* Dashboard */}
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'dashboard' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>

            {/* TON Wallet */}
            <button
              onClick={() => setActiveSection('tonWallet')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'tonWallet' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Wallet className="w-6 h-6" />
              <span className="text-xs font-medium">TON Wallet</span>
            </button>

            {/* Browse Task */}
            <button
              onClick={() => setActiveSection('browseTask')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'browseTask' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-medium">Browse Task</span>
            </button>

            {/* Transaction & Withdrawal */}
            <button
              onClick={() => setActiveSection('transactionWithdrawal')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'transactionWithdrawal' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Download className="w-6 h-6" />
              <span className="text-xs font-medium">Transactions</span>
            </button>

            {/* Profile Settings */}
            <button
              onClick={() => setActiveSection('profileSettings')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'profileSettings' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>


      </div>

      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          campaign={selectedTask}
          userId={userId}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Admin Balance Management Modal */}
      <AdminBalanceModal 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
        userId={userId}
      />

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={telegramUser}
      />
    </div>
  );
}
