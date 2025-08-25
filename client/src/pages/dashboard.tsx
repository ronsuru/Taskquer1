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
import { User, Wallet, Trophy, CheckCircle, Search, Plus, Filter, Settings, LogOut, User as UserIcon, Cog, Download } from "lucide-react";
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
  const [activeSection, setActiveSection] = useState<'tasks' | 'campaigns' | 'transactions' | 'withdraw' | 'profile'>('tasks');
  
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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-telegram-blue rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">TaskBot</h1>
            </div>
            <div className="flex items-center space-x-4">
                             {/* Admin Buttons - Multiple detection methods */}
               {(user?.isAdmin || user?.telegramId === "5154336054" || telegramUser?.id === 5154336054) && (
                 <>
                   <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setShowAdminPanel(true)}>
                     <Settings className="w-4 h-4 mr-2" />
                     BALANCE ADMIN
                   </Button>
                   <Button 
                     variant="default" 
                     size="sm" 
                     className="bg-purple-600 hover:bg-purple-700"
                     onClick={() => window.location.href = '/admin'}
                   >
                     <Settings className="w-4 h-4 mr-2" />
                     ADMIN DASHBOARD
                   </Button>
                 </>
               )}
               
               {/* Debug Admin Button - Always show for testing */}
               {process.env.NODE_ENV === 'development' && (
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="border-orange-500 text-orange-600"
                   onClick={() => {
                     console.log("Debug Admin Button Clicked");
                     console.log("Current state:", { user, telegramUser, userId });
                   }}
                 >
                   🐛 DEBUG ADMIN
                 </Button>
               )}
               
               {/* Fallback Admin Button - Show when user data is loading */}
               {!user && telegramUser?.id === 5154336054 && (
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="border-yellow-500 text-yellow-600"
                   onClick={() => window.location.href = '/admin'}
                 >
                   ⚠️ FALLBACK ADMIN
                 </Button>
               )}
              <div className="hidden sm:flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
                <Wallet className="w-4 h-4 text-telegram-blue" />
                <span className="text-sm font-medium text-slate-700">
                  {user?.balance || "0.00"} USDT
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {telegramUser?.photoUrl && (
                  <img 
                    src={telegramUser.photoUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-slate-600" />
                      <span>{telegramUser?.firstName || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                                         <DropdownMenuLabel className="font-normal">
                       <div className="flex flex-col space-y-1">
                         <div className="flex items-center space-x-2">
                           <p className="text-sm font-medium leading-none">
                             {telegramUser?.firstName} {telegramUser?.lastName}
                           </p>
                                                       {(user?.isAdmin || user?.telegramId === "5154336054" || telegramUser?.id === 5154336054) && (
                              <Badge variant="premium" className="text-xs">
                                ADMIN
                              </Badge>
                            )}
                         </div>
                         <p className="text-xs leading-none text-muted-foreground">
                           @{telegramUser?.username || 'user'}
                         </p>
                         <p className="text-xs leading-none text-muted-foreground">
                           ID: {telegramUser?.id}
                         </p>
                       </div>
                     </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSettingsClick}>
                      <Cog className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                                         {(user?.isAdmin || user?.telegramId === "5154336054" || telegramUser?.id === 5154336054) && (
                       <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                           <Settings className="mr-2 h-4 w-4" />
                           <span>Admin Dashboard</span>
                         </DropdownMenuItem>
                       </>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-telegram-blue to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to TaskBot</h2>
              <p className="text-blue-100 mb-4 max-w-2xl">
                Complete social media tasks and earn USDT rewards. Create campaigns to promote your content with our escrow system.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-400 opacity-20 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute right-8 bottom-0 w-20 h-20 bg-blue-300 opacity-20 rounded-full translate-y-4"></div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">User ID</p>
                    <p className="text-xl font-bold text-slate-900">#{userId}</p>
                  </div>
                  <div className="w-10 h-10 bg-telegram-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-telegram-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Balance</p>
                    <p className="text-xl font-bold text-slate-900">{user?.balance || "0.00"} USDT</p>
                  </div>
                  <div className="w-10 h-10 bg-success-green bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-success-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Rewards</p>
                    <p className="text-xl font-bold text-slate-900">{user?.rewards || "0.00"} USDT</p>
                  </div>
                  <div className="w-10 h-10 bg-warning-amber bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-warning-amber" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Tasks Completed</p>
                    <p className="text-xl font-bold text-slate-900">{user?.completedTasks || 0}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content */}
        <div className="space-y-6">

                    {/* Browse Tasks Section */}
          {activeSection === 'tasks' && (
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

          {/* Campaigns Section */}
          {activeSection === 'campaigns' && (
            <div className="space-y-6">
              <CampaignForm userId={userId} />
            </div>
          )}

          {/* Transactions Section */}
          {activeSection === 'transactions' && (
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
                          <p className="font-medium text-slate-900 capitalize">
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
            </div>
          )}

          {/* Withdraw Section */}
          {activeSection === 'withdraw' && (
            <div className="space-y-6">
              <WithdrawalForm userId={userId} userBalance={user?.balance || "0"} />
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
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
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {/* Tasks */}
            <button
              onClick={() => setActiveSection('tasks')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'tasks' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs font-medium">Tasks</span>
            </button>

            {/* Campaigns */}
            <button
              onClick={() => setActiveSection('campaigns')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'campaigns' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-medium">Campaigns</span>
            </button>

            {/* Transactions */}
            <button
              onClick={() => setActiveSection('transactions')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'transactions' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Wallet className="w-6 h-6" />
              <span className="text-xs font-medium">Transactions</span>
            </button>

            {/* Withdraw */}
            <button
              onClick={() => setActiveSection('withdraw')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'withdraw' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Download className="w-6 h-6" />
              <span className="text-xs font-medium">Withdraw</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                activeSection === 'profile' 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>

        {/* Support Section */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help?</h3>
                <p className="text-slate-600 text-sm">Contact our support team for assistance with tasks, payments, or campaigns.</p>
              </div>
              <Button className="bg-telegram-blue hover:bg-blue-600">
                <i className="fab fa-telegram mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </section>
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
