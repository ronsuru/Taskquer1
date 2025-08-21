import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tonService } from "./tonService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserSchema, insertCampaignSchema, insertTaskSubmissionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Object storage endpoints
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // User endpoints
  app.get("/api/users/:telegramId", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByTelegramId(userData.telegramId);
      
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const platform = req.query.platform as string;
      const campaigns = await storage.getCampaigns(platform);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      
      // Validate minimum values
      if (campaignData.totalSlots < 5) {
        return res.status(400).json({ error: "Minimum 5 slots required" });
      }
      
      if (parseFloat(campaignData.rewardAmount) < 0.015) {
        return res.status(400).json({ error: "Minimum reward amount is 0.015 USDT" });
      }

      // Calculate costs
      const baseAmount = parseFloat(campaignData.rewardAmount) * campaignData.totalSlots;
      const costs = tonService.calculateTotalCost(baseAmount.toString());

      const campaign = await storage.createCampaign({
        ...campaignData,
        availableSlots: campaignData.totalSlots,
        escrowAmount: costs.subtotal,
        fee: costs.fee,
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Transaction verification
  app.post("/api/transactions/verify", async (req, res) => {
    try {
      const { hash } = req.body;
      if (!hash) {
        return res.status(400).json({ error: "Transaction hash required" });
      }

      const verification = await tonService.verifyTransaction(hash);
      res.json(verification);
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Fund campaign
  app.post("/api/campaigns/:id/fund", async (req, res) => {
    try {
      const { hash, userId } = req.body;
      if (!hash || !userId) {
        return res.status(400).json({ error: "Transaction hash and user ID required" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify transaction
      const verification = await tonService.verifyTransaction(hash);
      if (!verification.valid) {
        return res.status(400).json({ error: "Invalid transaction" });
      }

      // Create funding transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: verification.amount || "0",
        fee: tonService.calculateFee(verification.amount || "0"),
        status: "completed",
        hash,
        campaignId: campaign.id,
      });

      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Error funding campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Task submission endpoints
  app.post("/api/submissions", async (req, res) => {
    try {
      const submissionData = insertTaskSubmissionSchema.parse(req.body);
      
      // Check if campaign exists and has available slots
      const campaign = await storage.getCampaign(submissionData.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.availableSlots <= 0) {
        return res.status(400).json({ error: "No available slots" });
      }

      const submission = await storage.createTaskSubmission(submissionData);
      
      // Update campaign slots
      await storage.updateCampaignSlots(campaign.id, campaign.availableSlots - 1);

      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid submission data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Handle proof file upload
  app.put("/api/submissions/:id/proof", async (req, res) => {
    try {
      const { proofImageURL } = req.body;
      if (!proofImageURL) {
        return res.status(400).json({ error: "Proof image URL required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(proofImageURL);

      // Update submission with proof URL
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json({ objectPath, success: true });
    } catch (error) {
      console.error("Error updating proof:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve/reject submissions
  app.put("/api/submissions/:id/review", async (req, res) => {
    try {
      const { status, userId } = req.body; // status: approved/rejected
      
      const submission = await storage.updateSubmissionStatus(req.params.id, status);
      
      if (status === "approved") {
        // Get campaign details for reward
        const campaign = await storage.getCampaign(submission.campaignId);
        if (campaign) {
          // Create reward transaction
          await storage.createTransaction({
            userId: submission.userId,
            type: "reward",
            amount: campaign.rewardAmount,
            fee: "0",
            status: "completed",
            campaignId: campaign.id,
          });

          // Update user balance
          const user = await storage.getUser(submission.userId);
          if (user) {
            const newBalance = (parseFloat(user.balance) + parseFloat(campaign.rewardAmount)).toString();
            await storage.updateUserBalance(user.id, newBalance);
          }
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user submissions
  app.get("/api/users/:userId/submissions", async (req, res) => {
    try {
      const submissions = await storage.getUserSubmissions(req.params.userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Withdrawal endpoints
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const { userId, amount, destinationWallet } = req.body;
      
      if (!userId || !amount || !destinationWallet) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate wallet address
      if (!tonService.validateAddress(destinationWallet)) {
        return res.status(400).json({ error: "Invalid TON wallet address" });
      }

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const fee = tonService.calculateFee(amount);
      const finalAmount = (parseFloat(amount) - parseFloat(fee)).toString();

      const withdrawal = await storage.createWithdrawal({
        userId,
        amount: finalAmount,
        fee,
        destinationWallet,
        status: "pending",
      });

      // Update user balance
      const newBalance = (parseFloat(user.balance) - parseFloat(amount)).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Process withdrawal
      const result = await tonService.processWithdrawal(destinationWallet, finalAmount);
      
      if (result.success) {
        await storage.updateWithdrawalStatus(withdrawal.id, "completed", result.hash);
      } else {
        await storage.updateWithdrawalStatus(withdrawal.id, "failed");
        // Refund balance on failure
        await storage.updateUserBalance(userId, user.balance);
      }

      res.status(201).json(withdrawal);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user transactions
  app.get("/api/users/:userId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user campaigns
  app.get("/api/users/:userId/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getUserCampaigns(req.params.userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
