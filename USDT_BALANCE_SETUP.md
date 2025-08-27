# USDT Balance Integration for TON Wallet

This document explains how to use the new USDT balance functionality in your TON wallet mini-app.

## What's New

The wallet service now includes comprehensive token balance tracking, specifically for USDT on the TON blockchain. You can now:

- ✅ Display real-time USDT balance alongside TON balance
- ✅ Monitor balances automatically every 30 seconds
- ✅ Cache balance data for better performance
- ✅ Get fresh balance data on demand

## Key Features

### 1. Real-time USDT Balance Display
- Shows USDT balance in a dedicated green box
- Displays USD equivalent value
- Updates automatically with real-time monitoring

### 2. Comprehensive Balance Fetching
```typescript
// Get both TON and USDT balances
const balances = await tonWalletService.getWalletBalances();
console.log('TON:', balances.ton);
console.log('USDT:', balances.tokens.USDT?.balance);
```

### 3. Real-time Monitoring
```typescript
// Start monitoring every 30 seconds
tonWalletService.startBalanceMonitoring(30000);

// Stop monitoring
tonWalletService.stopBalanceMonitoring();
```

### 4. Cached Balance Access
```typescript
// Get USDT balance with caching (30-second cache)
const usdtBalance = await tonWalletService.getRealTimeUSDTBalance();
```

## How to Use

### In Your Mini-App

1. **Connect Wallet**: The USDT balance will automatically appear once connected
2. **View Balances**: Both TON and USDT balances are displayed prominently
3. **Real-time Updates**: Balances update automatically every 30 seconds
4. **Manual Refresh**: Use the refresh button to get latest balances

### In Your Code

```typescript
import { tonWalletService } from '@/services/tonWalletService';

// Get comprehensive wallet data
const walletData = await tonWalletService.getWalletBalances();

// Access specific balances
const tonBalance = walletData.ton;
const usdtBalance = walletData.tokens.USDT?.balance || '0.00';

// Start real-time monitoring
tonWalletService.startBalanceMonitoring(15000); // Every 15 seconds
```

## Technical Details

### USDT Contract Address
The service uses the official USDT contract on TON mainnet:
```
EQB-MPwrd1G6MKNZb4qMNUZ8UV4wKXgw0jBUKZzqih4c0tTR
```

### Balance Caching
- TON balance: No caching (always fresh)
- USDT balance: 30-second cache for performance
- Cache automatically invalidates for fresh data

### Error Handling
- Graceful fallback to '0.00' if USDT fetch fails
- Continues working even if token balance API is unavailable
- Logs errors for debugging

## Troubleshooting

### USDT Balance Not Showing
1. Check if wallet is connected
2. Verify the wallet has USDT tokens
3. Check browser console for error messages
4. Try manual refresh

### Balance Not Updating
1. Ensure real-time monitoring is active
2. Check network connectivity
3. Verify TON API endpoints are accessible

### Performance Issues
1. Reduce monitoring frequency (increase interval)
2. Check if multiple monitoring instances are running
3. Clear browser cache if needed

## Future Enhancements

- [ ] Support for additional tokens (USDC, WBTC)
- [ ] Price feeds integration
- [ ] Transaction history for tokens
- [ ] Token swap functionality
- [ ] Multi-wallet support

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your TON wallet connection
3. Ensure you have the latest version of the service
4. Check network connectivity to TON APIs
