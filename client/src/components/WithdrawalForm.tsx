import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Coins } from "lucide-react";

interface WithdrawalFormProps {
  userId: string;
  userBalance: string;
}

export default function WithdrawalForm({ userId, userBalance }: WithdrawalFormProps) {
  const [withdrawalData, setWithdrawalData] = useState({
    amount: "",
    destinationWallet: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/withdrawals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal is being processed. You'll receive funds within 5-15 minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      setWithdrawalData({ amount: "", destinationWallet: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const calculateWithdrawal = () => {
    const amount = parseFloat(withdrawalData.amount) || 0;
    const fee = amount * 0.01;
    const finalAmount = amount - fee;
    
    return {
      withdrawAmount: amount.toFixed(8),
      networkFee: fee.toFixed(8),
      finalAmount: Math.max(0, finalAmount).toFixed(8),
    };
  };

  const withdrawal = calculateWithdrawal();

  const handleMaxWithdrawal = () => {
    setWithdrawalData(prev => ({ ...prev, amount: userBalance }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalData.amount);
    const balance = parseFloat(userBalance);
    
    if (!withdrawalData.destinationWallet) {
      toast({
        title: "Validation Error",
        description: "Please enter a TON wallet address",
        variant: "destructive",
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: "Validation Error",
        description: "Minimum withdrawal amount is 1 USDT",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Validation Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      userId,
      amount: withdrawalData.amount,
      destinationWallet: withdrawalData.destinationWallet,
    });
  };

  return (
         <Card>
       <CardContent>


                 <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2 pt-4">
             <Label htmlFor="wallet">TON Wallet Address</Label>
            <Input
              id="wallet"
              placeholder="EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv"
              className="font-mono text-sm"
              value={withdrawalData.destinationWallet}
              onChange={(e) => setWithdrawalData(prev => ({ ...prev, destinationWallet: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max={userBalance}
                placeholder="0.00"
                value={withdrawalData.amount}
                onChange={(e) => setWithdrawalData(prev => ({ ...prev, amount: e.target.value }))}
                className="pr-16"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 px-2 text-xs text-green-600 hover:text-green-700 font-medium transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={handleMaxWithdrawal}
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Withdrawal Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Withdrawal Amount:</span>
                <span className="font-medium text-slate-900">{withdrawal.withdrawAmount} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Network Fee (1%):</span>
                <span className="font-medium text-slate-900">{withdrawal.networkFee} USDT</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-900">You'll Receive:</span>
                <span className="font-bold text-success-green">{withdrawal.finalAmount} USDT</span>
              </div>
            </div>
          </div>

          <div className="bg-warning-amber bg-opacity-10 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <i className="fas fa-exclamation-triangle text-warning-amber mt-0.5"></i>
              <div className="text-sm text-white">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="text-white text-xs space-y-1">
                  <li>• Minimum withdrawal amount is 1 USDT</li>
                  <li>• Processing time: 5-15 minutes on TON Network</li>
                  <li>• Double-check your wallet address - transactions are irreversible</li>
                  <li>• 1% fee is deducted from withdrawal amount</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-success-green hover:bg-green-600 text-white"
            disabled={withdrawMutation.isPending}
          >
            {withdrawMutation.isPending ? "Processing..." : "Process Withdrawal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
