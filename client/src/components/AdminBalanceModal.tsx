import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Remove apiRequest import since we're using fetch directly
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus, Settings } from "lucide-react";

interface AdminBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AdminBalanceModal({ isOpen, onClose, userId }: AdminBalanceModalProps) {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [systemSettings, setSystemSettings] = useState({
    minWithdrawal: "",
    withdrawalFee: "",
    campaignCreationFee: "",
    minCampaignSlots: "",
    minRewardAmount: ""
  });
  
  const [selectedSetting, setSelectedSetting] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for dropdown interface
  const getSettingLabel = (setting: string) => {
    const labels: { [key: string]: string } = {
      minWithdrawal: "Minimum Withdrawal Amount (USDT)",
      withdrawalFee: "Withdrawal Fee (USDT)",
      campaignCreationFee: "Campaign Creation Fee (USDT)",
      minRewardAmount: "Minimum Reward per Task (USDT)",
      minCampaignSlots: "Minimum Campaign Slots"
    };
    return labels[setting] || "";
  };

  const getSettingPlaceholder = (setting: string) => {
    const placeholders: { [key: string]: string } = {
      minWithdrawal: "e.g., 5.00",
      withdrawalFee: "e.g., 0.50",
      campaignCreationFee: "e.g., 1.00",
      minRewardAmount: "e.g., 0.015",
      minCampaignSlots: "e.g., 5"
    };
    return placeholders[setting] || "";
  };

  const getSettingStep = (setting: string) => {
    const steps: { [key: string]: string } = {
      minWithdrawal: "0.01",
      withdrawalFee: "0.01",
      campaignCreationFee: "0.01",
      minRewardAmount: "0.001",
      minCampaignSlots: "1"
    };
    return steps[setting] || "0.01";
  };

  const getSettingMin = (setting: string) => {
    const mins: { [key: string]: string } = {
      minWithdrawal: "0",
      withdrawalFee: "0",
      campaignCreationFee: "0",
      minRewardAmount: "0",
      minCampaignSlots: "1"
    };
    return mins[setting] || "0";
  };

  // Load existing system settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        try {
          const res = await fetch("/api/admin/settings", {
            headers: { "x-user-id": "5154336054" }
          });
          if (res.ok) {
            const settings = await res.json();
            const settingsMap = settings.reduce((acc: any, setting: any) => {
              acc[setting.settingKey] = setting.settingValue;
              return acc;
            }, {});

            setSystemSettings({
              minWithdrawal: settingsMap["min_withdrawal_amount"] || "",
              withdrawalFee: settingsMap["withdrawal_fee"] || "",
              campaignCreationFee: settingsMap["campaign_creation_fee"] || "",
              minCampaignSlots: settingsMap["min_slots"] || "",
              minRewardAmount: settingsMap["min_reward_amount"] || ""
            });
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      };
      loadSettings();
    }
  }, [isOpen]);

  const setBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/set`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to set balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance set successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error setting balance", 
        description: error.message || "Failed to set balance",
        variant: "destructive" 
      });
    }
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to add balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error adding balance", 
        description: error.message || "Failed to add balance",
        variant: "destructive" 
      });
    }
  });

  const deductBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/deduct`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to deduct balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance deducted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deducting balance", 
        description: error.message || "Failed to deduct balance",
        variant: "destructive" 
      });
    }
  });

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (settings: typeof systemSettings) => {
      const res = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update system settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "System settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating settings", 
        description: error.message || "Failed to update system settings",
        variant: "destructive" 
      });
    }
  });

  const handleSetBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleAddBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    addBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleDeductBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    deductBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleUpdateSystemSettings = () => {
    if (!systemSettings.minWithdrawal || !systemSettings.withdrawalFee) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    updateSystemSettingsMutation.mutate(systemSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Balance Administration
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="balance">Balance Adjustment</TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings className="w-4 h-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance" className="space-y-4">
            {/* Form fields for balance operations */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUserId">Target User Telegram ID</Label>
                  <Input
                    id="targetUserId"
                    placeholder="e.g., 5154336054"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (USDT)</Label>
                  <Input
                    id="amount"
                    placeholder="e.g., 10.50"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Operation Sub-Tabs */}
            <Tabs defaultValue="set" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="set">Set Balance</TabsTrigger>
                <TabsTrigger value="add">Add Balance</TabsTrigger>
                <TabsTrigger value="deduct">Deduct Balance</TabsTrigger>
              </TabsList>

            <TabsContent value="set" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the user's balance to the exact amount specified.
              </p>
              <Button 
                onClick={handleSetBalance} 
                disabled={setBalanceMutation.isPending}
                className="w-full"
              >
                {setBalanceMutation.isPending ? "Setting..." : "Set Balance"}
              </Button>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add the specified amount to the user's current balance.
              </p>
              <Button 
                onClick={handleAddBalance} 
                disabled={addBalanceMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addBalanceMutation.isPending ? "Adding..." : "Add Balance"}
              </Button>
            </TabsContent>

            <TabsContent value="deduct" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deduct the specified amount from the user's current balance.
              </p>
              <Button 
                onClick={handleDeductBalance} 
                disabled={deductBalanceMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Minus className="w-4 h-4 mr-2" />
                {deductBalanceMutation.isPending ? "Deducting..." : "Deduct Balance"}
              </Button>
            </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            {/* Header Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-center">
              <p className="text-base text-amber-800 font-semibold mb-2">⚙️ System Configuration</p>
              <p className="text-sm text-amber-700">Adjust global platform settings and limits</p>
            </div>

            {/* Current Settings Overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Current System Settings</h4>
              <div className="grid grid-cols-1 gap-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="text-xs text-slate-600">Min Campaign Slots</span>
                  <span className="text-xs font-medium text-slate-800">{systemSettings.minCampaignSlots || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="text-xs text-slate-600">Min Withdrawal (USDT)</span>
                  <span className="text-xs font-medium text-slate-800">{systemSettings.minWithdrawal || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="text-xs text-slate-600">Withdrawal Fee (USDT)</span>
                  <span className="text-xs font-medium text-slate-800">{systemSettings.withdrawalFee || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="text-xs text-slate-600">Campaign Fee (USDT)</span>
                  <span className="text-xs font-medium text-slate-800">{systemSettings.campaignCreationFee || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-b-0">
                  <span className="text-xs text-slate-600">Min Reward (USDT)</span>
                  <span className="text-xs font-medium text-slate-800">{systemSettings.minRewardAmount || "Not set"}</span>
                </div>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-4">
              {/* Setting Selection Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="settingType" className="text-sm font-medium text-slate-700">
                  Select Setting to Update
                </Label>
                <select
                  id="settingType"
                  value={selectedSetting}
                  onChange={(e) => setSelectedSetting(e.target.value)}
                  className="w-full text-sm h-10 border border-slate-200 rounded-md px-3 py-2 focus:border-amber-400 focus:ring-amber-400 focus:outline-none bg-white"
                >
                  <option value="">Choose a setting...</option>
                  <option value="minWithdrawal">Minimum Withdrawal Amount (USDT)</option>
                  <option value="withdrawalFee">Withdrawal Fee (USDT)</option>
                  <option value="campaignCreationFee">Campaign Creation Fee (USDT)</option>
                  <option value="minRewardAmount">Minimum Reward per Task (USDT)</option>
                  <option value="minCampaignSlots">Minimum Campaign Slots</option>
                </select>
              </div>

              {/* Value Input Field */}
              {selectedSetting && (
                <div className="space-y-2">
                  <Label htmlFor="settingValue" className="text-sm font-medium text-slate-700">
                    {getSettingLabel(selectedSetting)}
                  </Label>
                  <Input
                    id="settingValue"
                    placeholder={getSettingPlaceholder(selectedSetting)}
                    type="number"
                    step={getSettingStep(selectedSetting)}
                    min={getSettingMin(selectedSetting)}
                    value={settingValue}
                    onChange={(e) => setSettingValue(e.target.value)}
                    className="text-sm h-10 border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="pt-3 border-t border-slate-200">
              <Button 
                onClick={handleUpdateSystemSettings} 
                disabled={updateSystemSettingsMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-sm h-10 font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                {updateSystemSettingsMutation.isPending ? "Updating..." : "Update System Settings"}
              </Button>
            </div>

            {/* Note Section */}
            <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start space-x-2">
                <span className="text-amber-500 mt-0.5">💡</span>
                <div>
                  <strong className="text-slate-600">Note:</strong> These settings affect the entire platform. Changes take effect immediately for new transactions/campaigns.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
        </DialogContent>
      </Dialog>
    );
}