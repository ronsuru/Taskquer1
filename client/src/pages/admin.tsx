import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Users, Wallet, TrendingUp, TrendingDown, DollarSign, Activity, Zap, Send, PlayCircle, Save, RotateCcw, Loader2, AlertCircle, User } from "lucide-react";

// Telegram Login Component
function TelegramLoginDialog({ isOpen, onClose, onLogin }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: (telegramId: string) => void; 
}) {
  const [telegramId, setTelegramId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!telegramId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Telegram ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify the user exists and is admin
      const response = await fetch(`/api/users/${telegramId}`);
      if (!response.ok) {
        throw new Error("User not found");
      }
      
      const user = await response.json();
      if (!user.isAdmin) {
        throw new Error("Access denied. Admin privileges required.");
      }

      onLogin(telegramId);
      toast({
        title: "Success",
        description: `Welcome, ${telegramId}! Admin access granted.`,
      });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate. Please check your Telegram ID.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Admin Login Required
          </DialogTitle>
          <DialogDescription>
            Please enter your Telegram ID to access the admin dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegramId">Telegram ID</Label>
            <Input
              id="telegramId"
              type="text"
              placeholder="Enter your Telegram ID (e.g., 6995615957)"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <p className="text-sm text-muted-foreground">
              This is your unique Telegram user ID, not your username.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleLogin} 
            disabled={isLoading || !telegramId.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface User {
  id: string;
  telegramId: string;
  walletAddress: string;
  balance: string;
  rewards: string;
  completedTasks: number;
  isAdmin: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  platform: string;
  totalSlots: number;
  availableSlots: number;
  rewardAmount: string;
  escrowAmount: string;
  status: string;
  createdAt: string;
  creator: User;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  fee: string;
  status: string;
  hash?: string;
  createdAt: string;
  user: User;
  campaign?: Campaign;
}

function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"set" | "add" | "deduct">("set");
  const [isTelegramLoginOpen, setIsTelegramLoginOpen] = useState(false);
  const [authenticatedTelegramId, setAuthenticatedTelegramId] = useState<string | null>(null);

  // Fetch admin data - only when authenticated
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", authenticatedTelegramId],
    queryFn: async () => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch("/api/admin/users", {
        headers: {
          "X-User-ID": authenticatedTelegramId,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!authenticatedTelegramId,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns", authenticatedTelegramId],
    queryFn: async () => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch("/api/admin/campaigns", {
        headers: {
          "X-User-ID": authenticatedTelegramId,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
    enabled: !!authenticatedTelegramId,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions", authenticatedTelegramId],
    queryFn: async () => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch("/api/admin/transactions", {
        headers: {
          "X-User-ID": authenticatedTelegramId,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
    enabled: !!authenticatedTelegramId,
  });

  // Balance mutations
  const balanceMutation = useMutation({
    mutationFn: async ({ userId, operation, amount }: { userId: string; operation: string; amount: string }) => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch(`/api/admin/users/${userId}/balance/${operation}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": authenticatedTelegramId!,
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error("Failed to update balance");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
      setSelectedUser(null);
      setAmount("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: "POST",
        headers: {
          "X-User-ID": authenticatedTelegramId,
        },
      });
      if (!response.ok) throw new Error("Failed to make user admin");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User granted admin access",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // TonKeeper automation mutations
  const processPendingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tonkeeper/process-pending", {
        method: "POST",
        headers: {
          "X-User-ID": authenticatedTelegramId!,
        },
      });
      if (!response.ok) throw new Error("Failed to process pending withdrawals");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Automation Complete",
        description: `Processed ${data.processed} withdrawals: ${data.successful} successful, ${data.failed} failed`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // TonKeeper status query
  const { data: tonkeeperStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/tonkeeper/status", authenticatedTelegramId],
    queryFn: async () => {
      if (!authenticatedTelegramId) throw new Error("Not authenticated");
      const response = await fetch("/api/tonkeeper/status", {
        headers: {
          "X-User-ID": authenticatedTelegramId!,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch TonKeeper status");
      return response.json();
    },
    enabled: !!authenticatedTelegramId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Debug: Log when authenticatedTelegramId changes
  useEffect(() => {
    console.log("AdminPage: authenticatedTelegramId changed to:", authenticatedTelegramId);
  }, [authenticatedTelegramId]);

  const handleBalanceUpdate = () => {
    if (!selectedUser || !amount) return;
    balanceMutation.mutate({ userId: selectedUser.id, operation, amount });
  };

  // Calculate stats
  const totalUsers = users?.length || 0;
  const totalBalance = users?.reduce((sum, user) => sum + parseFloat(user.balance), 0) || 0;
  const totalRewards = users?.reduce((sum, user) => sum + parseFloat(user.rewards), 0) || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Badge variant="secondary">System Management</Badge>
        </div>
        
        {!authenticatedTelegramId ? (
          <Button 
            onClick={() => setIsTelegramLoginOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <User className="h-4 w-4 mr-2" />
            Login with Telegram
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <User className="h-3 w-3 mr-1" />
              {authenticatedTelegramId}
            </Badge>
            <Button 
              variant="outline"
              onClick={() => setAuthenticatedTelegramId(null)}
              size="sm"
            >
              Logout
            </Button>
          </div>
        )}
      </div>

      {!authenticatedTelegramId ? (
        <div className="text-center py-16">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 mb-6">Please login with your Telegram ID to access the admin dashboard.</p>
          <Button 
            onClick={() => setIsTelegramLoginOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <User className="h-5 w-5 mr-2" />
            Login with Telegram
          </Button>
        </div>
      ) : (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              Combined user balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRewards.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              Rewards distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Running campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TonKeeper Automation Panel */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>TonKeeper Automation</CardTitle>
                <CardDescription>Automated fund transfers and wallet management</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusLoading ? (
                <Badge variant="outline">Checking...</Badge>
              ) : tonkeeperStatus?.healthy ? (
                <Badge variant="default" className="bg-green-600">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Wallet className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium text-slate-700">Wallet Balance</div>
              <div className="text-lg font-bold">{tonkeeperStatus?.balance || "0.0000"} TON</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Send className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium text-slate-700">Auto Transfers</div>
              <div className="text-lg font-bold">{tonkeeperStatus?.walletReady ? "Ready" : "Offline"}</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <PlayCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium text-slate-700">Pending Queue</div>
              <div className="text-lg font-bold">Auto-Process</div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={() => processPendingMutation.mutate()}
              disabled={processPendingMutation.isPending || !tonkeeperStatus?.healthy}
              className="flex-1"
            >
              {processPendingMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Process All Pending Withdrawals
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/tonkeeper/status"] })}
              disabled={statusLoading}
            >
              <Zap className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>Manage user accounts and balances</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Telegram ID</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                        <TableCell>{user.telegramId}</TableCell>
                        <TableCell className="font-mono text-xs">{user.walletAddress.slice(0, 20)}...</TableCell>
                        <TableCell>{parseFloat(user.balance).toFixed(4)} USDT</TableCell>
                        <TableCell>{parseFloat(user.rewards).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Balance
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage User Balance</DialogTitle>
                                  <DialogDescription>
                                    Update balance for user {user.telegramId}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Current Balance</Label>
                                    <div className="text-2xl font-bold">{parseFloat(user.balance).toFixed(8)} USDT</div>
                                  </div>
                                  <div>
                                    <Label htmlFor="operation">Operation</Label>
                                    <select 
                                      id="operation"
                                      className="w-full mt-1 p-2 border rounded"
                                      value={operation}
                                      onChange={(e) => setOperation(e.target.value as any)}
                                    >
                                      <option value="set">Set Balance</option>
                                      <option value="add">Add Amount</option>
                                      <option value="deduct">Deduct Amount</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="amount">Amount (USDT)</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      step="0.00000001"
                                      placeholder="0.00000000"
                                      value={amount}
                                      onChange={(e) => setAmount(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleBalanceUpdate}
                                    disabled={balanceMutation.isPending || !amount}
                                  >
                                    {balanceMutation.isPending ? "Updating..." : "Update Balance"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {!user.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => makeAdminMutation.mutate(user.id)}
                                disabled={makeAdminMutation.isPending}
                              >
                                Make Admin
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns Management</CardTitle>
              <CardDescription>Monitor all platform campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Slots</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-xs text-muted-foreground">{campaign.id.slice(0, 8)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.platform.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{campaign.creator.telegramId}</TableCell>
                        <TableCell>
                          {campaign.availableSlots}/{campaign.totalSlots}
                        </TableCell>
                        <TableCell>{parseFloat(campaign.rewardAmount).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "active" ? "default" : "outline"}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Monitor all platform transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-xs">{transaction.id.slice(0, 8)}...</div>
                            {transaction.hash && (
                              <div className="text-xs text-muted-foreground">{transaction.hash.slice(0, 16)}...</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.user.telegramId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell>{parseFloat(transaction.amount).toFixed(4)} USDT</TableCell>
                        <TableCell>{parseFloat(transaction.fee).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === "completed" ? "default" : "outline"}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <div className="grid gap-6">
            {/* TonKeeper Service Status */}
            <Card>
              <CardHeader>
                <CardTitle>TonKeeper Service Status</CardTitle>
                <CardDescription>Real-time status of automated transfer system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">Service Health</div>
                      <div className="text-sm text-muted-foreground">Overall system status</div>
                    </div>
                    <Badge variant={tonkeeperStatus?.healthy ? "default" : "destructive"}>
                      {tonkeeperStatus?.healthy ? "Healthy" : "Unhealthy"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">Wallet Connection</div>
                      <div className="text-sm text-muted-foreground">TON wallet connectivity</div>
                    </div>
                    <Badge variant={tonkeeperStatus?.walletReady ? "default" : "outline"}>
                      {tonkeeperStatus?.walletReady ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">Available Balance</div>
                      <div className="text-sm text-muted-foreground">Current wallet balance</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{tonkeeperStatus?.balance || "0.0000"} TON</div>
                    </div>
                  </div>
                  
                  {tonkeeperStatus?.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-medium text-red-800">Error</div>
                      <div className="text-sm text-red-600">{tonkeeperStatus.error}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Automation Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Controls</CardTitle>
                <CardDescription>Manage automated withdrawal processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <Button
                    onClick={() => processPendingMutation.mutate()}
                    disabled={processPendingMutation.isPending || !tonkeeperStatus?.healthy}
                    size="lg"
                    className="w-full"
                  >
                    {processPendingMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing Withdrawals...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Process All Pending Withdrawals
                      </>
                    )}
                  </Button>
                  
                  <div className="text-sm text-muted-foreground text-center">
                    This will automatically process all pending withdrawal requests using the TonKeeper integration.
                    Funds will be transferred from the bot wallet to user addresses.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Info */}
            <Card>
              <CardHeader>
                <CardTitle>TonKeeper Integration Features</CardTitle>
                <CardDescription>Enhanced automation capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Automated Fund Transfers</div>
                      <div className="text-sm text-muted-foreground">
                        Direct USDT transfers from bot wallet to user addresses
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Batch Processing</div>
                      <div className="text-sm text-muted-foreground">
                        Process multiple withdrawals efficiently with rate limiting
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Error Handling & Retry Logic</div>
                      <div className="text-sm text-muted-foreground">
                        Automatic retry on failures with exponential backoff
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Real-time Status Monitoring</div>
                      <div className="text-sm text-muted-foreground">
                        Live monitoring of wallet status and transfer success rates
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <SystemSettingsPanel />
        </TabsContent>
      </Tabs>
        </>
      )}

      {/* Telegram Login Dialog */}
      <TelegramLoginDialog
        isOpen={isTelegramLoginOpen}
        onClose={() => setIsTelegramLoginOpen(false)}
        onLogin={(telegramId) => {
          setAuthenticatedTelegramId(telegramId);
          setIsTelegramLoginOpen(false);
        }}
      />
    </div>
  );

  // System Settings Panel Component
  function SystemSettingsPanel() {
    console.log("SystemSettingsPanel: Component rendered, authenticatedTelegramId:", authenticatedTelegramId);
    
    const { data: systemSettings, isLoading: settingsLoading } = useQuery<Array<{settingKey: string, settingValue: string}>>({
      queryKey: ["/api/admin/settings", authenticatedTelegramId],
      queryFn: async () => {
        if (!authenticatedTelegramId) throw new Error("Not authenticated");
        const response = await fetch("/api/admin/settings", {
          headers: {
            "X-User-ID": authenticatedTelegramId,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch system settings");
        return response.json();
      },
      enabled: !!authenticatedTelegramId,
    });

    console.log("SystemSettingsPanel: Query result - data:", systemSettings, "loading:", settingsLoading);

    const [tempSettings, setTempSettings] = useState<{ [key: string]: string }>({});

    useEffect(() => {
      console.log("SystemSettingsPanel: systemSettings received:", systemSettings);
      if (systemSettings) {
        const settings: { [key: string]: string } = {};
        systemSettings.forEach((setting: any) => {
          settings[setting.settingKey] = setting.settingValue;
        });
        console.log("SystemSettingsPanel: processed settings:", settings);
        setTempSettings(settings);
      }
    }, [systemSettings]);

    const updateSettingsMutation = useMutation({
      mutationFn: async (settings: { key: string; value: string; description?: string }[]) => {
        if (!authenticatedTelegramId) throw new Error("Not authenticated");
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": authenticatedTelegramId,
          },
          body: JSON.stringify({ settings }),
        });
        if (!response.ok) throw new Error("Failed to update system settings");
        return response.json();
      },
      onSuccess: () => {
        toast({ description: "System settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings", authenticatedTelegramId] });
      },
      onError: () => {
        toast({ description: "Failed to update system settings", variant: "destructive" });
      }
    });

    const handleSaveSettings = () => {
      const settingsToUpdate = Object.entries(tempSettings).map(([key, value]) => ({
        key,
        value,
        description: getSettingDescription(key)
      }));

      updateSettingsMutation.mutate(settingsToUpdate);
    };

    const handleInputChange = (key: string, value: string) => {
      setTempSettings(prev => ({
        ...prev,
        [key]: value
      }));
    };

    const getSettingDescription = (key: string) => {
      const descriptions: { [key: string]: string } = {
        "min_slots": "Minimum number of tasker slots required for campaigns",
        "min_reward_amount": "Minimum reward amount per tasker (USDT)",
        "min_withdrawal_amount": "Minimum withdrawal amount allowed (USDT)",
        "campaign_fee_rate": "Campaign creation fee rate (1% = 0.01)",
        "withdrawal_fee_rate": "Fee charged per withdrawal (1% = 0.01)"
      };
      return descriptions[key] || "";
    };

    const getSettingLabel = (key: string) => {
      const labels: { [key: string]: string } = {
        "min_slots": "Minimum Tasker Slots",
        "min_reward_amount": "Minimum Reward per Tasker (USDT)",
        "min_withdrawal_amount": "Minimum Withdrawal Amount (USDT)",
        "campaign_fee_rate": "Campaign Fee Rate (%)",
        "withdrawal_fee_rate": "Fee per Withdrawal (%)"
      };
      return labels[key] || key;
    };

    const formatValueForDisplay = (key: string, value: string) => {
      if (key.includes("fee_rate")) {
        return (parseFloat(value) * 100).toString(); // Convert to percentage
      }
      return value;
    };

    const formatValueForSaving = (key: string, value: string) => {
      if (key.includes("fee_rate")) {
        return (parseFloat(value) / 100).toString(); // Convert from percentage
      }
      return value;
    };

    if (settingsLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure platform minimum values and fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">Loading settings...</div>
          </CardContent>
        </Card>
      );
    }

    // If no settings are loaded, show a message
    if (!systemSettings || systemSettings.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure platform minimum values and fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No system settings found. Please check the database configuration.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure minimum withdrawal, minimum reward per tasker, minimum tasker slots, and fees per withdrawal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Changes to these settings will affect new campaigns and transactions immediately.
              Existing campaigns will not be affected.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(tempSettings).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{getSettingLabel(key)}</Label>
                <Input
                  id={key}
                  type="number"
                  step={key.includes("amount") ? "0.001" : "0.01"}
                  min="0"
                  value={formatValueForDisplay(key, value)}
                  onChange={(e) => handleInputChange(key, formatValueForSaving(key, e.target.value))}
                  placeholder={getSettingDescription(key)}
                />
                <p className="text-sm text-muted-foreground">
                  {getSettingDescription(key)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="flex-1"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                if (systemSettings) {
                  const settings: { [key: string]: string } = {};
                  systemSettings.forEach((setting: any) => {
                    settings[setting.settingKey] = setting.settingValue;
                  });
                  setTempSettings(settings);
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

export default AdminPage;