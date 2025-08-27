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
import CreateCampaignModal from "@/components/CreateCampaignModal";
import { User, Wallet, Trophy, CheckCircle, Search, Plus, Filter, Settings, LogOut, User as UserIcon, Cog, Download, Bell, Globe, Crown, Clock, RefreshCw } from "lucide-react";
import type { Campaign, User as UserType, Transaction } from "@shared/schema";
import { useTelegram } from "@/contexts/TelegramContext";
import { TelegramAppLauncher } from "@/components/TelegramAppLauncher";
import { UserProfileModal } from "@/components/UserProfileModal";
import { tonWalletService } from "@/services/tonWalletService";
import { socialMediaService } from "@/services/socialMediaService";
import { EmbeddedWallet } from "@/components/EmbeddedWallet";
import { EnhancedWalletIntegration } from "@/components/EnhancedWalletIntegration";
import { toast } from "@/hooks/use-toast";
import TonkeeperWallet from "./tonkeeper-wallet";

export default function Dashboard() {
  const { user: telegramUser, isTelegramApp, isInitialized } = useTelegram();
  const [selectedTask, setSelectedTask] = useState<Campaign | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tonWallet' | 'tonkeeperWallet' | 'browseTask' | 'transactionWithdrawal' | 'profileSettings'>('dashboard');
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [walletUSDTBalance, setWalletUSDTBalance] = useState('0.00');
  const [useTelegramPhoto, setUseTelegramPhoto] = useState(() => {
    const saved = localStorage.getItem('useTelegramPhoto');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  // Load saved wallet address from localStorage on component mount
  useEffect(() => {
    const savedWalletAddress = localStorage.getItem('user_wallet_address');
    if (savedWalletAddress) {
      setWalletAddress(savedWalletAddress);
    }
  }, []);
  
  // Initialize nickname with user's first name when component mounts
  useEffect(() => {
    if (telegramUser?.firstName && !nickname) {
      setNickname(telegramUser.firstName);
    }
  }, [telegramUser?.firstName, nickname]);
  
  // Load saved profile data from localStorage on component mount
  useEffect(() => {
    const savedNickname = localStorage.getItem('user_nickname');
    const savedDateOfBirth = localStorage.getItem('user_date_of_birth');
    
    if (savedNickname) {
      setNickname(savedNickname);
    }
    if (savedDateOfBirth) {
      setDateOfBirth(savedDateOfBirth);
    }
  }, []);
  
  // Fetch wallet USDT balance when component mounts and when wallet data changes
  useEffect(() => {
    const fetchWalletBalance = () => {
      const walletData = tonWalletService.getWalletData();
      if (walletData?.isConnected && walletData.tokens?.USDT) {
        setWalletUSDTBalance(walletData.tokens.USDT.balance);
      } else {
        // If no wallet connected, check if there's a saved address and try to get balance
        const savedAddress = localStorage.getItem('user_wallet_address');
        if (savedAddress && tonWalletService.validateTONAddress(savedAddress)) {
          // Try to fetch the balance for the saved address
          tonWalletService.getAllTokenBalances(savedAddress)
            .then(tokens => {
              if (tokens.USDT) {
                setWalletUSDTBalance(tokens.USDT.balance);
              }
            })
            .catch(error => {
              console.log('Could not fetch wallet balance:', error);
            });
        }
      }
    };
    
    fetchWalletBalance();
    
    // Set up an interval to refresh the balance every 30 seconds
    const interval = setInterval(fetchWalletBalance, 30000);
    
    return () => clearInterval(interval);
  }, []);
  const [connectedSocialAccounts, setConnectedSocialAccounts] = useState<Map<string, any>>(new Map());
  
  // Draft management state
  const [drafts, setDrafts] = useState<any[]>([]);

  
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

  // Load drafts from localStorage
  useEffect(() => {
    const loadDrafts = () => {
      const savedDrafts = localStorage.getItem(`campaign_drafts_${userId}`);
      if (savedDrafts) {
        try {
          const parsedDrafts = JSON.parse(savedDrafts);
          setDrafts(parsedDrafts);
        } catch (error) {
          console.error('Error loading drafts:', error);
        }
      }
    };

    loadDrafts();
    
    // Check for drafts periodically (for same-tab updates)
    const interval = setInterval(loadDrafts, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  // Handle dropdown menu actions
  const handleProfileClick = () => {
    console.log("Profile button clicked!");
    setShowProfile(true);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    console.log("Settings clicked for user:", telegramUser?.firstName);
  };

  const handleLogoutClick = () => {
    console.log("Logout clicked for user:", telegramUser?.firstName);
    alert("Logout functionality coming soon!");
  };

  const handleDetailsUpdate = () => {
    console.log("Details updated - Nickname:", nickname, "Date of Birth:", dateOfBirth);
    
    // Save to localStorage for persistence
    if (nickname.trim()) {
      localStorage.setItem('user_nickname', nickname.trim());
    }
    if (dateOfBirth) {
      localStorage.setItem('user_date_of_birth', dateOfBirth);
    }
    
    setIsEditingDetails(false);
    toast({
      title: "Details Updated",
      description: "Your profile details have been updated successfully!",
    });
  };

  const handleDetailsCancel = () => {
    // Restore original values
    setNickname(telegramUser?.firstName || '');
    setDateOfBirth('');
    setIsEditingDetails(false);
  };

  const handleProfilePhotoToggle = () => {
    console.log("Profile photo toggle clicked!");
    console.log("Current useTelegramPhoto:", useTelegramPhoto);
    setUseTelegramPhoto(!useTelegramPhoto);
    localStorage.setItem('useTelegramPhoto', JSON.stringify(!useTelegramPhoto));
  };

  const handleWalletAddressUpdate = () => {
    console.log("Wallet address updated to:", walletAddress);
    
    // Save to localStorage for persistence
    if (walletAddress.trim()) {
      localStorage.setItem('user_wallet_address', walletAddress.trim());
      
      // Also save to wallet service if it's a valid TON address
      try {
        if (tonWalletService.validateTONAddress(walletAddress.trim())) {
          // Set the wallet data in the service
          tonWalletService.setWalletData(walletAddress.trim(), '0.00');
          console.log('Wallet address saved to wallet service');
        }
      } catch (error) {
        console.log('Could not save to wallet service:', error);
      }
    }
    
    setIsEditingWallet(false);
    toast({
      title: "Wallet Address Updated",
      description: "Your wallet address has been saved and will be automatically connected next time you open the mini-app.",
    });
  };

  const handleWalletAddressCancel = () => {
    // Restore the previous saved wallet address
    const savedWalletAddress = localStorage.getItem('user_wallet_address');
    setWalletAddress(savedWalletAddress || '');
    setIsEditingWallet(false);
  };

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns/all"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/all");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/users", userId, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/transactions`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Filter campaigns based on platform
  const filteredCampaigns = campaigns.filter((campaign: Campaign) => 
    platformFilter === "all" || campaign.platform === platformFilter
  );

  // Platform icons mapping
  const platformIcons: { [key: string]: string } = {
    twitter: "fab fa-twitter",
    tiktok: "fab fa-tiktok", 
    facebook: "fab fa-facebook",
    telegram: "fab fa-telegram"
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Draft management functions
  const deleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem(`campaign_drafts_${userId}`, JSON.stringify(updatedDrafts));
  };

  const openDraftInModal = (draft: any) => {
    // Store the draft data in localStorage temporarily so the modal can access it
    localStorage.setItem(`selected_draft_${userId}`, JSON.stringify(draft));
    // Also store the draft ID to know we're editing an existing draft
    localStorage.setItem(`editing_draft_id_${userId}`, draft.id);
    setShowCreateCampaign(true);
  };

  return (
    <>
      {/* Main Content Area */}
      <div className="h-screen bg-slate-50 mini-app-container telegram-mini-app flex flex-col overflow-hidden">
        {/* Sticky Header Section - Only show when Dashboard is active */}
        {activeSection === 'dashboard' && (
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-6 pt-8 z-40 mini-app-header">
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
                    <h1 className="text-xl font-bold text-slate-900">
                      Hi {nickname} 👋
                    </h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-slate-600">Welcome back to Taskquer</p>
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
                  <Badge 
                    variant="premium" 
                    className="text-xs cursor-pointer hover:bg-yellow-500 hover:text-white transition-all duration-200 transform hover:scale-105"
                    onClick={() => setShowAdminPanel(true)}
                  >
                    ADMIN
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto mini-app-content pb-24">
          <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-3 py-6 mt-4">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Dashboard Section */}
              {activeSection === 'dashboard' && (
                <div className="space-y-4">
                  <div className="text-2xl font-semibold leading-none tracking-tight px-1">Quick Overview</div>
                  <div className="space-y-4">
                                         {/* Balance and Total Rewards Row */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="bg-blue-50 p-4 rounded-lg">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                               <Wallet className="w-5 h-5 text-blue-600" />
                             </div>
                             <div>
                               <p className="text-sm text-blue-600">Wallet Balance</p>
                               <p className="text-xl font-bold text-blue-900">{walletUSDTBalance} USDT</p>
                               <p className="text-xs text-blue-600 mt-1">Connected TON Wallet</p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 // Refresh wallet balance
                                 const walletData = tonWalletService.getWalletData();
                                 if (walletData?.isConnected && walletData.tokens?.USDT) {
                                   setWalletUSDTBalance(walletData.tokens.USDT.balance);
                                 } else {
                                   const savedAddress = localStorage.getItem('user_wallet_address');
                                   if (savedAddress && tonWalletService.validateTONAddress(savedAddress)) {
                                     tonWalletService.getAllTokenBalances(savedAddress)
                                       .then(tokens => {
                                         if (tokens.USDT) {
                                           setWalletUSDTBalance(tokens.USDT.balance);
                                         }
                                       })
                                       .catch(error => {
                                         console.log('Could not refresh wallet balance:', error);
                                       });
                                   }
                                 }
                               }}
                               className="text-blue-600 hover:text-blue-700"
                               title="Refresh balance"
                             >
                               <RefreshCw className="w-4 h-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setActiveSection('transactionWithdrawal')}
                               className="text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                             >
                               <Download className="w-4 h-4 mr-1" />
                               Withdraw
                             </Button>
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
                    
                    
                    
                                         {/* Ready to earn? Call-to-Action */}
                     <div 
                       className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-between"
                       onClick={() => setActiveSection('browseTask')}
                     >
                       <div>
                         <h3 className="font-semibold mb-2">Ready to earn?</h3>
                         <p className="text-blue-100 text-sm">Browse available tasks and start earning USDT rewards!</p>
                       </div>
                       <div className="ml-4">
                         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 group">
                           <div className="text-white text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                             &gt;
                           </div>
                           {/* Futuristic glow effect */}
                           <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         </div>
                       </div>
                     </div>
                     
                     {/* Create a Campaign Call-to-Action */}
                     <div 
                       className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-lg text-white cursor-pointer hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-between"
                       onClick={() => setShowCreateCampaign(true)}
                     >
                       <div>
                         <h3 className="font-semibold mb-2">Create a Campaign</h3>
                         <p className="text-green-100 text-sm">Boost awareness by rewarding taskers for participation.</p>
                       </div>
                       <div className="ml-4">
                         <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 group">
                           <div className="text-white text-xl font-bold group-hover:scale-110 transition-transform duration-300">
                             +
                           </div>
                           {/* Futuristic glow effect */}
                           <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                         </div>
                       </div>
                     </div>


                  </div>
                </div>
              )}

                             {/* TON Wallet Section */}
               {activeSection === 'tonWallet' && (
                 <div className="space-y-6 px-1 -mt-4">
                  <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg text-white text-center">
                    <h3 className="text-lg font-bold mb-2">TON Wallet Integration</h3>
                    <p className="text-sm text-orange-100">Connect your TON wallet to manage your crypto assets</p>
                  </div>
                  
                  {/* Embedded Wallet Component */}
                  <EnhancedWalletIntegration />
                </div>
              )}

                             {/* Tonkeeper Wallet Section */}
               {activeSection === 'tonkeeperWallet' && (
                 <div className="space-y-6 px-1 -mt-4">
                  <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 rounded-lg text-white text-center">
                    <h3 className="text-lg font-bold mb-2">Tonkeeper Wallet</h3>
                    <p className="text-sm text-blue-100">Connect directly to your Tonkeeper wallet for real-time balances</p>
                  </div>
                  
                  {/* Tonkeeper Wallet Component */}
                  <TonkeeperWallet />
                </div>
              )}

                             {/* Browse Tasks Section */}
               {activeSection === 'browseTask' && (
                 <div className="space-y-6 px-1 -mt-4">
                  {/* Campaign Tasks Header */}
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-6 text-center text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-2">CAMPAIGN TASKS</h3>
                    <p className="text-sm text-blue-100">Discover and complete tasks to earn rewards</p>
                  </div>
                
                  {/* Platform Filter */}
                  <div className="flex items-center space-x-3 mb-6">
                    <Filter className="w-6 h-6 text-slate-600" />
                    <span className="text-sm font-medium text-slate-600">Filter by Platform:</span>
                    
                    {/* All Platforms Button */}
                    <Button 
                      variant={platformFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlatformFilter("all")}
                      className="px-3 py-1 h-8 text-sm font-medium"
                    >
                      (All)
                    </Button>
                    
                    {/* Platform-specific buttons with icons only */}
                    {[
                      { key: "twitter", icon: "fab fa-twitter" },
                      { key: "tiktok", icon: "fab fa-tiktok" },
                      { key: "facebook", icon: "fab fa-facebook" },
                      { key: "telegram", icon: "fab fa-telegram" }
                    ].map(({ key, icon }) => (
                      <Button
                        key={key}
                        variant={platformFilter === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlatformFilter(key)}
                        className="px-4 py-2 h-10"
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                      >
                        <i className={`${icon} text-lg`} />
                      </Button>
                    ))}
                  </div>

                  {/* Active Campaigns Container */}
                  <div className="mb-6">
                    <Card>
                      <CardHeader>
                                                 <CardTitle className="text-base font-semibold flex items-center gap-2">
                           🚀 Active Campaigns
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {filteredCampaigns.filter((campaign: Campaign) => campaign.status === 'active').map((campaign: Campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-gray-900 truncate">
                                  {campaign.title || "Untitled Campaign"}
                                </h5>
                                <p className="text-xs text-gray-600 truncate mt-1">
                                  Platform: {campaign.platform} • Slots: {campaign.availableSlots} • Reward: {campaign.rewardAmount} USDT
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {new Date(campaign.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-3">
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTask(campaign)}
                                  className="text-xs px-3 py-1 h-7"
                                >
                                  Start Task
                                </Button>
                              </div>
                            </div>
                          ))}
                          {filteredCampaigns.filter((campaign: Campaign) => campaign.status === 'active').length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                              <p>No active campaigns available</p>
                              <p className="text-sm">Check back later for new opportunities</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Campaign Drafts Container */}
                  <div className="mb-6">
                    <Card>
                      <CardHeader>
                                                 <CardTitle className="text-base font-semibold flex items-center gap-2">
                           📝 Campaign Drafts
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {drafts.length > 0 ? (
                          <div className="space-y-3">
                            {drafts.map((draft) => (
                              <div key={draft.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {draft.title || "Untitled Draft"}
                                  </h5>
                                  <p className="text-xs text-gray-600 truncate">
                                    {draft.platform && `Platform: ${draft.platform}`}
                                    {draft.platform && draft.description && " • "}
                                    {draft.description && `${draft.description.substring(0, 50)}${draft.description.length > 50 ? '...' : ''}`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDraftInModal(draft)}
                                    className="text-xs px-2 py-1 h-7"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteDraft(draft.id)}
                                    className="text-xs px-2 py-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <p>No saved drafts yet</p>
                            <p className="text-sm">Create a campaign and save it as a draft to see it here</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Task Cards */}
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {filteredCampaigns.map((campaign: Campaign) => (
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
                 <div className="space-y-6 px-1 -mt-4">
                  {/* Withdraw Earnings Header */}
                  <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-lg p-6 text-center text-white shadow-lg">
                    <h3 className="text-lg font-bold mb-2">Withdraw Earnings</h3>
                    <p className="text-sm text-green-100">Convert your USDT rewards to your TON wallet</p>
                  </div>
                  
                                     {/* Withdrawal Form */}
                   <WithdrawalForm userId={userId} userBalance={user?.balance || "0"} />
                  
                  {/* Transaction History */}
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Transaction History</h3>
                    <div className="space-y-3">
                      {transactions.map((transaction: Transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "reward" ? "bg-green-100" : 
                              transaction.type === "withdrawal" ? "bg-red-100" : "bg-blue-100"
                            }`}>
                              {transaction.type === "reward" ? (
                                <Trophy className="w-5 h-5 text-green-600" />
                              ) : transaction.type === "withdrawal" ? (
                                <Download className="w-5 h-5 text-red-600" />
                              ) : (
                                <Wallet className="w-5 h-5 text-blue-600" />
                              )}
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
                    </div>
                  </div>
                </div>
              )}

                                            {/* Profile & Settings Section */}
               {activeSection === 'profileSettings' && (
                 <div className="space-y-6 px-1 -mt-4">
                   {/* User Profile */}
                   <Card>
                     <CardHeader className="relative pb-1">
                       <CardTitle className="text-base">User Profile</CardTitle>
                       {/* Profile Photo Placeholder - Top Right Corner */}
                       <div className="absolute top-4 right-4 w-16 h-16 bg-gray-100 rounded-full border-4 border-blue-100 flex items-center justify-center">
                         {telegramUser?.photoUrl ? (
                           <img 
                             src={telegramUser.photoUrl} 
                             alt="Profile" 
                             className="w-full h-full rounded-full object-cover"
                           />
                         ) : (
                           <User className="w-8 h-8 text-gray-400" />
                         )}
                       </div>
                     </CardHeader>
                    <CardContent className="pt-1 space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="space-y-1">
                            <h3 className="text-base font-semibold">
                              {telegramUser?.firstName} {telegramUser?.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{telegramUser?.username || 'No username'}
                            </p>
                          </div>
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
                            {!isEditingDetails && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingDetails(true)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                          
                          {isEditingDetails ? (
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
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                <div className="flex gap-2">
                                  <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {dateOfBirth && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDateOfBirth('')}
                                      className="text-red-600 hover:text-red-700"
                                      title="Clear date"
                                    >
                                      Clear
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={handleDetailsUpdate}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleDetailsCancel}
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
                                <span className="text-sm text-slate-600 font-medium">{nickname || 'Not set'}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Date of Birth:</span>
                                <span className="text-sm text-slate-600 font-medium">
                                  {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Not set'}
                                </span>
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                   {/* Task & Campaign Statistics */}
                   <Card>
                     <CardContent className="p-6">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="bg-blue-50 p-4 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                               <CheckCircle className="w-5 h-5 text-blue-600" />
                             </div>
                             <div>
                               <p className="text-sm text-blue-600">Total Tasks Completed</p>
                               <p className="text-lg font-bold text-blue-900">{user?.completedTasks || 0}</p>
                             </div>
                           </div>
                         </div>
                         
                         <div className="bg-orange-50 p-4 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                               <Clock className="w-5 h-5 text-orange-600" />
                             </div>
                             <div>
                               <p className="text-sm text-orange-600">Ongoing<br />Tasks</p>
                               <p className="text-lg font-bold text-orange-900">0</p>
                             </div>
                           </div>
                         </div>
                         
                         <div className="bg-green-50 p-4 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                               <Plus className="w-5 h-5 text-green-600" />
                             </div>
                             <div>
                               <p className="text-sm text-green-600">Campaigns Created</p>
                               <p className="text-lg font-bold text-green-900">0</p>
                             </div>
                           </div>
                         </div>
                         
                         <div className="bg-purple-50 p-4 rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                               <Trophy className="w-5 h-5 text-purple-600" />
                             </div>
                             <div>
                               <p className="text-sm text-purple-600">Ongoing Campaigns</p>
                               <p className="text-lg font-bold text-purple-900">0</p>
                             </div>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Settings</CardTitle>
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
          </div>
        </div>





        {/* Bottom Navigation Bar - Fixed Position */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 px-6 py-4 z-50 mini-app-bottom-nav">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {/* Dashboard */}
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'dashboard' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <CheckCircle className={`w-5 h-5 ${activeSection === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">Dashboard</span>
            </button>

            {/* Wallet */}
            <button
              onClick={() => setActiveSection('tonWallet')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'tonWallet' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <Wallet className={`w-5 h-5 ${activeSection === 'tonWallet' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">Wallet</span>
            </button>

            {/* Tonkeeper Wallet */}
            <button
              onClick={() => setActiveSection('tonkeeperWallet')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'tonkeeperWallet' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <Wallet className={`w-5 h-5 ${activeSection === 'tonkeeperWallet' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">Tonkeeper</span>
            </button>

            {/* Browse Task */}
            <button
              onClick={() => setActiveSection('browseTask')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'browseTask' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <Trophy className={`w-5 h-5 ${activeSection === 'browseTask' ? 'text-blue-600' : 'text-blue-600'}`} />
              <span className="text-xs font-medium">Tasks</span>
            </button>

            {/* Transactions */}
            <button
              onClick={() => setActiveSection('transactionWithdrawal')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'transactionWithdrawal' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <Download className={`w-5 h-5 ${activeSection === 'transactionWithdrawal' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">Transactions</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => setActiveSection('profileSettings')}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-200 ${
                activeSection === 'profileSettings' 
                ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50/50'
              }`}
            >
              <User className={`w-5 h-5 ${activeSection === 'profileSettings' ? 'text-blue-600' : 'text-blue-600'}`} />
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

      {/* Create Campaign Modal */}
      <CreateCampaignModal 
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        userId={userId}
      />
    </>
  );
}
