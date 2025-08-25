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
import { User, Wallet, Trophy, CheckCircle, Search, Plus, Filter, Settings, LogOut, User as UserIcon, Cog, Download, Bell, Globe, Crown } from "lucide-react";
import type { Campaign, User as UserType, Transaction } from "@shared/schema";
import { useTelegram } from "@/contexts/TelegramContext";
import { TelegramAppLauncher } from "@/components/TelegramAppLauncher";
import { UserProfileModal } from "@/components/UserProfileModal";
import { tonWalletService } from "@/services/tonWalletService";
import { EmbeddedWallet } from "@/components/EmbeddedWallet";
import { EnhancedWalletIntegration } from "@/components/EnhancedWalletIntegration";

export default function Dashboard() {
  const { user: telegramUser, isTelegramApp, isInitialized } = useTelegram();
  const [selectedTask, setSelectedTask] = useState<Campaign | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tonWallet' | 'browseTask' | 'transactionWithdrawal' | 'profileSettings'>('dashboard');
  const [nickname, setNickname] = useState(telegramUser?.firstName || '');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [useTelegramPhoto, setUseTelegramPhoto] = useState(() => {
    // Try to get the saved preference from localStorage
    const saved = localStorage.getItem('useTelegramPhoto');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    youtube: '',
    discord: '',
    tiktok: ''
  });
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  
  // Wallet connection state
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  
  // Use Telegram user ID if available, otherwise fallback to hardcoded ID
  const userId = telegramUser?.id?.toString() || "5154336054";

  // Check initial wallet connection status
  useEffect(() => {
    const checkWalletStatus = () => {
      const data = tonWalletService.getWalletData();
      if (data?.isConnected) {
        setWalletConnected(true);
        setWalletData(data);
      }
    };
    
    checkWalletStatus();
  }, []);

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

  const handleNicknameUpdate = () => {
    // Here you can add API call to update nickname in database
    console.log("Nickname updated to:", nickname);
    setIsEditingNickname(false);
    // You can add a success message here
    alert("Nickname updated successfully!");
  };

  const handleNicknameCancel = () => {
    setNickname(telegramUser?.firstName || '');
    setIsEditingNickname(false);
  };

  const handleProfilePhotoToggle = () => {
    console.log("Profile photo toggle clicked!");
    console.log("Current useTelegramPhoto:", useTelegramPhoto);
    console.log("Telegram photo URL:", telegramUser?.photoUrl);
    
    const newValue = !useTelegramPhoto;
    setUseTelegramPhoto(newValue);
    
    // Save the preference to localStorage
    localStorage.setItem('useTelegramPhoto', JSON.stringify(newValue));
    
    console.log("Setting useTelegramPhoto to:", newValue);
    console.log("Saved preference to localStorage");
  };

  const handleWalletAddressUpdate = () => {
    // Here you can add API call to update wallet address in database
    console.log("Wallet address updated to:", walletAddress);
    setIsEditingWallet(false);
    // You can add a success message here
    alert("Wallet address updated successfully!");
  };

  const handleWalletAddressCancel = () => {
    setWalletAddress(user?.walletAddress || '');
    setIsEditingWallet(false);
  };

  // Wallet connection functions
  const handleConnectWallet = async () => {
    try {
      setIsWalletConnecting(true);
      const success = await tonWalletService.connectWallet();
      
      if (success) {
        setWalletConnected(true);
        const data = tonWalletService.getWalletData();
        setWalletData(data);
        console.log('Wallet connected successfully:', data);
      } else {
        console.error('Failed to connect wallet');
        alert('Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet. Please try again.');
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await tonWalletService.disconnectWallet();
      setWalletConnected(false);
      setWalletData(null);
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleSocialLinkUpdate = (platform: string) => {
    // Here you can add API call to update social links in database
    console.log(`${platform} link updated to:`, socialLinks[platform as keyof typeof socialLinks]);
    setEditingSocial(null);
    // You can add a success message here
    alert(`${platform} link updated successfully!`);
  };

  const handleSocialLinkCancel = (platform: string) => {
    // Reset to original value (you can load from user data)
    setSocialLinks(prev => ({
      ...prev,
      [platform]: ''
    }));
    setEditingSocial(null);
  };

  // Fetch user data
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Update nickname when Telegram user data changes
  useEffect(() => {
    if (telegramUser?.firstName && !nickname) {
      setNickname(telegramUser.firstName);
    }
  }, [telegramUser?.firstName, nickname]);

  // Update wallet address when user data changes
  useEffect(() => {
    if (user?.walletAddress && !walletAddress) {
      setWalletAddress(user.walletAddress);
    }
  }, [user?.walletAddress, walletAddress]);

  // Debug logging - Remove after testing
  useEffect(() => {
    console.log("=== DEBUG INFO ===");
    console.log("useTelegramPhoto state:", useTelegramPhoto);
    console.log("telegramUser:", telegramUser);
    console.log("telegramUser.photoUrl:", telegramUser?.photoUrl);
    console.log("Telegram User:", telegramUser);
    console.log("Photo URL:", telegramUser?.photoUrl);
    console.log("First Name:", telegramUser?.firstName);
    console.log("User ID:", userId);
    console.log("User data:", user);
    console.log("User telegramId:", user?.telegramId);
    console.log("User isAdmin:", user?.isAdmin);
    console.log("Hardcoded admin check:", user?.telegramId === "5154336054");
    console.log("Combined admin check:", user?.isAdmin || user?.telegramId === "5154336054");
    console.log("==================");
  }, [useTelegramPhoto, telegramUser, user, userId]);

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
      {/* Header Section - Only show when Dashboard is active */}
      {activeSection === 'dashboard' && (
        <div className="bg-white px-4 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            {/* Greetings */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                               {/* User Avatar Circle */}
                 {(() => {
                   console.log("Rendering avatar - useTelegramPhoto:", useTelegramPhoto, "photoUrl:", telegramUser?.photoUrl);
                   // Show Telegram photo if toggle is ON and photo URL exists
                   if (useTelegramPhoto && telegramUser?.photoUrl) {
                     return (
                       <div className="relative group cursor-pointer">
                         <img 
                           src={telegramUser.photoUrl} 
                           alt="Profile" 
                           className="w-16 h-16 rounded-full border-2 border-blue-100"
                           onError={(e) => {
                             console.log("Avatar image failed to load:", telegramUser.photoUrl);
                             e.currentTarget.style.display = 'none';
                           }}
                         />
                         {/* Toggle Button Overlay */}
                         <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                           <button
                             onClick={handleProfilePhotoToggle}
                             className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-80 rounded-full p-2"
                             title="Switch to in-app photo"
                           >
                             <Settings className="w-5 w-5 text-gray-600" />
                           </button>
                         </div>
                       </div>
                     );
                   }
                   
                   // Show in-app photo if toggle is OFF or no Telegram photo
                   return (
                     <div className="w-16 h-16 rounded-full border-2 border-blue-100 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative group cursor-pointer">
                       <User className="w-8 h-8 text-white" />
                                          {/* Toggle Button Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                                     <button
                             onClick={handleProfilePhotoToggle}
                             className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-80 rounded-full p-2"
                             title="Switch to Telegram photo"
                           >
                            <Settings className="w-5 h-5 text-gray-600" />
                          </button>
                </div>
              </div>
                   );
                 })()}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Hi {nickname} 👋
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-slate-600">Welcome back to Taskquer</p>
                    {telegramUser?.photoUrl && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {useTelegramPhoto ? '📱' : '🎨'}
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
            
                                               {/* Admin Badge */}
              <div className="flex items-center space-x-3">
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
                0
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Ongoing Task
              </div>
                    </div>
                    </div>
                  </div>
        )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 mini-app-content">
        {/* Main Content */}
        <div className="space-y-6">
                     {/* Dashboard Section */}
           {activeSection === 'dashboard' && (
             <div className="space-y-6 mt-8">
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
                  <div className="space-y-6 px-4 mt-8">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg text-white text-center">
                      <h3 className="text-xl font-bold mb-2">TON Wallet Integration</h3>
                      <p className="text-orange-100">Connect your TON wallet to manage your crypto assets</p>
                    </div>
                    
                    {/* Embedded Wallet Component */}
                    <EnhancedWalletIntegration />
                  </div>
                )}

                                                                                       {/* Browse Tasks Section */}
                           {activeSection === 'browseTask' && (
                <div className="space-y-6 px-4 mt-8">
                                  {/* Campaign Tasks Header */}
                   <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-6 text-center text-white shadow-lg">
                    <h3 className="text-xl font-bold mb-2">CAMPAIGN TASKS</h3>
                    <p className="text-blue-100">Discover and complete tasks to earn rewards</p>
                  </div>
                
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
                  <div className="space-y-6 px-4 mt-8">
                    {/* Withdraw Earnings Header */}
                    <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-lg p-6 text-center text-white shadow-lg">
                      <h3 className="text-xl font-bold mb-2">Withdraw Earnings</h3>
                      <p className="text-green-100">Withdraw your USDT rewards to your wallet</p>
                    </div>
                  
                  {/* Withdrawal Form */}
                  <WithdrawalForm userId={userId} userBalance={user?.balance || "0"} />

                  {/* Transaction History */}
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
                </div>
              )}

                     {/* Profile & Settings Section */}
           {activeSection === 'profileSettings' && (
             <div className="space-y-6 mt-8">
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
                         @{telegramUser?.username || 'No username'}
                       </h3>
                       {telegramUser?.isPremium && (
                         <Badge variant="premium" className="mt-1">
                           <Crown className="w-3 h-3 mr-1" />
                           Premium
                         </Badge>
                       )}
                     </div>
                   </div>
                  
                  <div className="space-y-4">
                                         {/* Profile Photo Section */}
                                           <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-medium text-slate-700">Profile Photo</label>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-slate-600">Use Telegram Photo</span>
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer focus:outline-none" 
                                checked={useTelegramPhoto}
                                onChange={handleProfilePhotoToggle}
                              />
                              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                     
                     

                                                              {/* Details Section */}
                     <div className="border-t pt-4">
                       <div className="flex items-center justify-between mb-2">
                         <label className="text-sm font-medium text-slate-700">Details</label>
                         {!isEditingNickname && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setIsEditingNickname(true)}
                             className="text-blue-600 hover:text-blue-700"
                           >
                             Edit
                           </Button>
                         )}
                       </div>
                       
                                             {isEditingNickname ? (
                         <div className="space-y-3">
                           <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
                             <input
                               type="text"
                               value={nickname}
                               onChange={(e) => setNickname(e.target.value)}
                               className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Enter your nickname"
                               maxLength={20}
                             />
                           </div>
                           <div className="flex space-x-2">
                             <Button
                               size="sm"
                               onClick={handleNicknameUpdate}
                               className="bg-blue-600 hover:bg-blue-700"
                             >
                               Save
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={handleNicknameCancel}
                             >
                               Cancel
                             </Button>
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           <div className="flex items-center space-x-3">
                             <User className="w-4 h-4 text-muted-foreground" />
                             <span className="text-sm font-medium">Nickname:</span>
                             <span className="text-sm text-slate-600 font-medium">{nickname}</span>
                           </div>
                         </div>
                       )}
                    </div>
                    
                                                                                      <div className="space-y-3">
                         <div className="flex items-center space-x-3">
                           <User className="w-4 h-4 text-muted-foreground" />
                           <span className="text-sm font-medium">User ID:</span>
                           <span className="text-sm text-muted-foreground">{userId}</span>
                         </div>
                         <div className="flex items-center space-x-3">
                           <User className="w-4 h-4 text-muted-foreground" />
                           <span className="text-sm font-medium">Date of Birth:</span>
                           <span className="text-sm text-slate-600 font-medium">Not set</span>
                         </div>
                       </div>
                      


                                           {/* Socials Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-medium text-slate-700">Social Media Links</label>
                          <span className="text-xs text-slate-500">Connect your social accounts</span>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Facebook */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-700">Facebook</span>
                            </div>
                            
                            {editingSocial === 'facebook' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={socialLinks.facebook}
                                  onChange={(e) => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))}
                                  className="px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                  placeholder="https://facebook.com/username"
                                />
                                <button
                                  onClick={() => handleSocialLinkUpdate('facebook')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleSocialLinkCancel('facebook')}
                                  className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-600 max-w-32 truncate">
                                  {socialLinks.facebook || 'Not linked'}
                                </span>
                                <button
                                  onClick={() => setEditingSocial('facebook')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {socialLinks.facebook ? 'Edit' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Twitter */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-700">Twitter</span>
                            </div>
                            
                            {editingSocial === 'twitter' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={socialLinks.twitter}
                                  onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                                  className="px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                  placeholder="https://twitter.com/username"
                                />
                                <button
                                  onClick={() => handleSocialLinkUpdate('twitter')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleSocialLinkCancel('twitter')}
                                  className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-600 max-w-32 truncate">
                                  {socialLinks.twitter || 'Not linked'}
                                </span>
                                <button
                                  onClick={() => setEditingSocial('twitter')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {socialLinks.twitter ? 'Edit' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* YouTube */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-700">YouTube</span>
                            </div>
                            
                            {editingSocial === 'youtube' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={socialLinks.youtube}
                                  onChange={(e) => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                                  className="px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                  placeholder="https://youtube.com/@username"
                                />
                                <button
                                  onClick={() => handleSocialLinkUpdate('youtube')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleSocialLinkCancel('youtube')}
                                  className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-600 max-w-32 truncate">
                                  {socialLinks.youtube || 'Not linked'}
                                </span>
                                <button
                                  onClick={() => setEditingSocial('youtube')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {socialLinks.youtube ? 'Edit' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Discord */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.2462.1982.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-700">Discord</span>
                            </div>
                            
                            {editingSocial === 'discord' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={socialLinks.discord}
                                  onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                                  className="px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                  placeholder="username#1234"
                                />
                                <button
                                  onClick={() => handleSocialLinkUpdate('discord')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleSocialLinkCancel('discord')}
                                  className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-600 max-w-32 truncate">
                                  {socialLinks.discord || 'Not linked'}
                                </span>
                                <button
                                  onClick={() => setEditingSocial('discord')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {socialLinks.discord ? 'Edit' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* TikTok */}
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-slate-700">TikTok</span>
                            </div>
                            
                            {editingSocial === 'tiktok' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={socialLinks.tiktok}
                                  onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                                  className="px-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                                  placeholder="https://tiktok.com/@username"
                                />
                                <button
                                  onClick={() => handleSocialLinkUpdate('tiktok')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleSocialLinkCancel('tiktok')}
                                  className="px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-slate-600 max-w-32 truncate">
                                  {socialLinks.tiktok || 'Not linked'}
                                </span>
                                <button
                                  onClick={() => setEditingSocial('tiktok')}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  {socialLinks.tiktok ? 'Edit' : 'Add'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
              
                             <Card>
                 <CardHeader>
                   <CardTitle>Settings</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-3">
                     <Button 
                       variant="outline" 
                       className="w-full justify-start"
                       onClick={() => setShowAccountSettings(!showAccountSettings)}
                     >
                       <Settings className="w-4 h-4 mr-2" />
                       Account Settings
                       <span className="ml-auto">
                         {showAccountSettings ? '▼' : '▶'}
                       </span>
                     </Button>
                     
                     {/* Expandable Account Settings */}
                     {showAccountSettings && (
                       <div className="pl-4 border-l-2 border-blue-200 space-y-4">
                         <div className="space-y-3">
            <div className="flex items-center justify-between">
                             <label className="text-sm font-medium text-slate-700">Wallet Address</label>
                             {!isEditingWallet && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => setIsEditingWallet(true)}
                                 className="text-blue-600 hover:text-blue-700"
                               >
                                 Edit
                               </Button>
                             )}
              </div>
                           
                           {isEditingWallet ? (
                             <div className="space-y-3">
                               <input
                                 type="text"
                                 value={walletAddress}
                                 onChange={(e) => setWalletAddress(e.target.value)}
                                 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                 placeholder="Enter your wallet address"
                                 maxLength={100}
                               />
                               <div className="flex space-x-2">
                                 <Button
                                   size="sm"
                                   onClick={handleWalletAddressUpdate}
                                   className="bg-blue-600 hover:bg-blue-700"
                                 >
                                   Save
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={handleWalletAddressCancel}
                                 >
                                   Cancel
              </Button>
            </div>
          </div>
                           ) : (
                             <div className="flex items-center space-x-3">
                               <Wallet className="w-4 h-4 text-muted-foreground" />
                               <span className="text-sm font-medium">Address:</span>
                               <span className="text-sm text-slate-600 font-mono break-all">
                                 {walletAddress || 'No wallet address set'}
                               </span>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                   
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
