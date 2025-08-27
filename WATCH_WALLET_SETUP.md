# Watch Wallet Integration

This document describes the Watch Wallet functionality that has been integrated into the Taskquer2 mini-app, providing Tonkeeper's "Watch-only-wallet" capabilities as a container inside the mini-app.

## Overview

The Watch Wallet feature allows users to monitor TON wallets without connecting their own wallet, providing a read-only view of wallet balances, transactions, and other wallet information. This is particularly useful for:

- Monitoring other wallets (e.g., project wallets, exchange wallets)
- Tracking transaction history
- Viewing token balances
- Keeping tabs on wallet activity without requiring wallet connection

## Features

### Core Functionality
- **Add Wallet to Watch**: Enter any valid TON wallet address to start monitoring
- **Universal Address Support**: Accepts bounceable (EQ), non-bounceable (UQ), and raw hex formats
- **Real-time Updates**: Automatic refresh every 30 seconds
- **Multiple Wallets**: Watch multiple wallets simultaneously
- **Persistent Storage**: Watched wallets are saved locally and restored on app restart
- **Recent Addresses**: Quick access to previously watched addresses

### Wallet Information Display
- **TON Balance**: Current TON coin balance
- **USDT Balance**: Current USDT token balance
- **Transaction History**: Recent incoming and outgoing transactions
- **Wallet Status**: Active monitoring status and last update time

### User Interface
- **Tabbed Interface**: Overview, Transactions, Tokens, and Analytics tabs
- **Responsive Design**: Optimized for both mobile and desktop
- **Quick Actions**: Copy address, view on TONScan, refresh data
- **Visual Indicators**: Color-coded transaction types and status badges

## Technical Implementation

### Frontend Components
- **WatchPage**: Main page component (`client/src/pages/watch.tsx`)
- **WatchWalletService**: Service layer for wallet operations (`client/src/services/watchWalletService.ts`)
- **Navigation Integration**: Added to main dashboard navigation

### Backend API Endpoints
- `GET /api/watch-wallet/:address` - Fetch wallet data
- `POST /api/watch-wallet/:address/refresh` - Refresh wallet data

### Data Flow
1. User enters wallet address
2. Frontend validates address format
3. Backend fetches real wallet data from TON blockchain
4. Data is cached locally and updated periodically
5. UI displays wallet information in real-time

## Usage

### Adding a Wallet to Watch
1. Navigate to the "Watch" tab in the main navigation
2. Enter a valid TON wallet address (starts with "EQ")
3. Click "Watch" button
4. Wallet will be added to the watched list

### Managing Watched Wallets
- **Refresh**: Click refresh button to manually update wallet data
- **Stop Watching**: Click stop button to remove wallet from monitoring
- **View Details**: Use tabs to explore different aspects of wallet data

### Address Validation
The system now supports all TON wallet address formats:

- **EQ...** - Bounceable addresses (workchain 0) - e.g., `EQBQLMDDw9022vZaXNXdWfh0om2sP_4AONerajNCnmcuLXJh`
- **UQ...** - Non-bounceable addresses (workchain 0) - e.g., `UQBQLMDDw9022vZaXNXdWfh0om2sP_4AONerajNCnmcuLXJh`
- **0:0:...** - Raw hex format (workchain 0) - e.g., `0:0:1234567890abcdef...`
- **-1:...** - Raw hex format (workchain -1) - e.g., `-1:1234567890abcdef...`

The validation is comprehensive and accepts any reasonable TON address format, making it easy to watch wallets regardless of how the address is presented.

## Integration with Tonkeeper

This implementation provides a container for Tonkeeper's watch-only wallet functionality, allowing users to:

- Monitor any TON wallet address
- View real-time balance updates
- Track transaction history
- Access wallet information without wallet connection

The service layer can be easily extended to integrate with Tonkeeper's official APIs when available.

## Configuration

### Environment Variables
No additional environment variables are required for basic functionality.

### Local Storage
- `watch_wallet_data`: Stores watched wallet information
- `watch_wallet_recent_addresses`: Stores recently used addresses

## Future Enhancements

### Planned Features
- **QR Code Scanning**: Scan wallet addresses from QR codes
- **Token Support**: Display all supported token balances
- **Transaction Analytics**: Charts and graphs for transaction patterns
- **Notifications**: Alert system for significant wallet changes
- **Export Data**: Download wallet data for external analysis

### API Integrations
- **Tonkeeper API**: Direct integration with Tonkeeper's official API
- **TON Center**: Enhanced transaction history and analytics
- **Jetton Support**: Full support for all TON-based tokens

## Security Considerations

- **Read-Only Access**: No private keys or signing capabilities
- **Address Validation**: Strict validation of TON address format
- **Rate Limiting**: API calls are limited to prevent abuse
- **Local Storage**: Sensitive data is not stored on the server

## Troubleshooting

### Common Issues
1. **Invalid Address Format**: The system now supports multiple TON address formats:
   - **EQ...** (bounceable) - Most common format, 48-50 characters
   - **UQ...** (non-bounceable) - Alternative format, 48-50 characters  
   - **0:0:...** (raw hex) - Workchain 0 format
   - **-1:...** (raw hex) - Workchain -1 format
2. **Address Length Issues**: TON addresses should be between 40-60 characters depending on format
3. **API Errors**: Check network connection and server status
4. **Data Not Updating**: Verify wallet is actively being watched

### Debug Information
- Check browser console for API call logs
- Verify backend server is running
- Check network tab for API request/response details

## Support

For technical support or feature requests related to the Watch Wallet functionality, please refer to the main project documentation or create an issue in the project repository.
