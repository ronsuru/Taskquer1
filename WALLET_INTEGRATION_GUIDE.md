# 🚀 TON Wallet Integration Guide

This guide explains how the Taskquer mini-app integrates with TON wallets, providing both native wallet functionality and seamless integration with the official @wallet bot.

## 🎯 Overview

Instead of just having a button to open the @wallet bot, we've created a comprehensive wallet integration system that gives users the best of both worlds:

1. **Native Wallet**: Built-in TON wallet functionality using TON Connect v2
2. **@wallet Bot Integration**: Direct access to the official Telegram TON wallet bot
3. **Smart Bridge**: Intelligent switching between both options based on user needs

## 🔧 Components

### 1. EmbeddedWallet Component
- **Location**: `client/src/components/EmbeddedWallet.tsx`
- **Purpose**: Provides native TON wallet functionality
- **Features**:
  - Connect/disconnect TON wallets
  - Send and receive TON
  - View transaction history
  - Manage wallet settings
  - Real-time balance updates

### 2. WalletBridgeService
- **Location**: `client/src/services/walletBridgeService.ts`
- **Purpose**: Handles communication with the @wallet bot
- **Features**:
  - Deep linking to specific @wallet bot actions
  - Popup menus with wallet options
  - Fallback handling for non-Telegram environments

### 3. EnhancedWalletIntegration Component
- **Location**: `client/src/components/EnhancedWalletIntegration.tsx`
- **Purpose**: Main integration interface combining all wallet options
- **Features**:
  - Tabbed interface for different wallet modes
  - Smart recommendations
  - Integration status monitoring

## 🌐 How It Works

### Native Wallet Mode
```typescript
// Uses TON Connect v2 for direct blockchain interaction
const connector = new TonConnect({
  manifestUrl: '/tonconnect-manifest.json'
});

// Connect to supported wallets (Tonkeeper, etc.)
await connector.connect(walletConnectionSource);
```

### @wallet Bot Integration
```typescript
// Deep link to specific @wallet bot actions
walletBridgeService.openWalletWithAction('send');
walletBridgeService.openWalletWithAmount('10.5', 'EQ...');
walletBridgeService.openWalletWithAddress('EQ...');
```

### Smart Bridge Mode
- Automatically detects available options
- Provides recommendations based on user actions
- Seamlessly switches between native and bot modes

## 📱 Telegram Mini App Integration

### Deep Linking
The integration uses Telegram's deep linking capabilities to open the @wallet bot with specific parameters:

```typescript
// Basic wallet opening
'https://t.me/wallet?start=taskquer'

// With specific action
'https://t.me/wallet?start=taskquer_send'

// With amount and address
'https://t.me/wallet?start=taskquer_amount_10.5_to_EQ...'
```

### Popup Menus
When running in Telegram, the integration shows native popup menus:

```typescript
window.Telegram.WebApp.showPopup({
  title: 'TON Wallet Options',
  message: 'Choose how you want to interact with your wallet:',
  buttons: [
    { type: 'default', text: '💰 Send TON', id: 'send_ton' },
    { type: 'default', text: '📥 Receive TON', id: 'receive_ton' },
    // ... more options
  ]
});
```

## 🎨 User Experience

### Three-Tab Interface

1. **Native Tab**: Full-featured built-in wallet
2. **Bot Tab**: Direct access to @wallet bot features
3. **Bridge Tab**: Smart recommendations and mode switching

### Responsive Design
- Works seamlessly on both mobile and desktop
- Automatically adapts to Telegram Mini App environment
- Graceful fallbacks for web browsers

### Smart Recommendations
The bridge mode provides intelligent suggestions:
- **Quick Transactions**: Use @wallet bot for fast operations
- **Advanced Management**: Use native wallet for detailed control
- **Context-Aware**: Suggests the best option based on user action

## 🔒 Security Features

### Native Wallet Security
- Uses TON Connect v2 protocol
- Secure wallet connection handling
- Local transaction signing
- No private key exposure

### @wallet Bot Security
- Official Telegram bot integration
- Secure deep linking
- User authentication through Telegram
- No sensitive data transmission

## 🚀 Advanced Features

### Action-Specific Deep Linking
```typescript
// Send TON with pre-filled amount
walletBridgeService.openWalletWithAmount('10.5');

// Send TON to specific address
walletBridgeService.openWalletWithAmount('10.5', 'EQ...');

// Open specific wallet section
walletBridgeService.openWalletWithAction('history');
```

### Popup Integration
```typescript
// Show comprehensive wallet options
walletBridgeService.showWalletOptions();

// Handle user selections
window.Telegram.WebApp.onEvent('popupClosed', (buttonId) => {
  switch (buttonId) {
    case 'send_ton':
      walletBridgeService.openWalletWithAction('send');
      break;
    // ... handle other actions
  }
});
```

## 📊 Integration Status Monitoring

The system continuously monitors integration status:

- **Native Wallet**: Always available
- **@wallet Bot**: Available when running in Telegram
- **Bridge Mode**: Active when both options are available

## 🔧 Configuration

### Environment Variables
```env
# TON Connect configuration
TON_CONNECT_MANIFEST_URL=/tonconnect-manifest.json
TON_NETWORK=mainnet
```

### Telegram Bot Setup
```json
{
  "telegram": {
    "bot_token": "your_bot_token",
    "web_app_info": {
      "url": "https://your-domain.com"
    }
  }
}
```

## 🧪 Testing

### Local Development
```bash
# Start development server
npm run dev

# Test wallet integration
# 1. Open in Telegram Mini App
# 2. Test native wallet connection
# 3. Test @wallet bot deep linking
# 4. Test bridge mode switching
```

### Production Testing
```bash
# Build and deploy
npm run build
npm run deploy

# Test in production Telegram environment
# Verify all deep links work correctly
# Test fallback behavior
```

## 🚨 Troubleshooting

### Common Issues

1. **@wallet Bot Not Opening**
   - Verify running in Telegram environment
   - Check deep link format
   - Ensure bot is accessible

2. **Native Wallet Connection Failed**
   - Check TON Connect configuration
   - Verify network connectivity
   - Check wallet compatibility

3. **Deep Links Not Working**
   - Verify Telegram WebApp API availability
   - Check URL format and parameters
   - Test in different Telegram versions

### Debug Mode
```typescript
// Enable debug logging
console.log('Wallet Bot Available:', walletBridgeService.isWalletBotAvailable());
console.log('Telegram Environment:', isTelegramApp);
console.log('Integration Status:', walletBridgeService.getWalletBotInfo());
```

## 🔮 Future Enhancements

### Planned Features
- **Multi-Wallet Support**: Connect multiple TON wallets
- **Transaction Templates**: Save common transaction patterns
- **Advanced Analytics**: Detailed wallet usage statistics
- **Cross-Chain Support**: Integration with other blockchains

### API Extensions
- **Webhook Integration**: Real-time wallet updates
- **Batch Operations**: Multiple transactions at once
- **Smart Routing**: Automatic fee optimization

## 📚 Resources

### Documentation
- [TON Connect v2 Documentation](https://github.com/ton-connect/docs)
- [Telegram Mini Apps API](https://core.telegram.org/bots/webapps)
- [@wallet Bot Documentation](https://t.me/wallet)

### Code Examples
- [TON Connect Examples](https://github.com/ton-connect/examples)
- [Telegram WebApp Examples](https://github.com/Ajaxy/telegram-tt)

### Community
- [TON Community](https://t.me/toncoin)
- [Telegram Developers](https://t.me/BotFather)

---

## 🎉 Summary

This wallet integration provides users with:

✅ **Native wallet functionality** for full control  
✅ **Seamless @wallet bot integration** for official features  
✅ **Smart bridge mode** for optimal user experience  
✅ **Deep linking** for specific wallet actions  
✅ **Responsive design** for all platforms  
✅ **Security** through TON Connect v2  
✅ **Fallback support** for non-Telegram environments  

Users can now manage their TON wallets entirely within the Taskquer mini-app while maintaining access to all official @wallet bot features when needed.
