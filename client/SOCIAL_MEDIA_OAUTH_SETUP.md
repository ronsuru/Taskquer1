# Social Media OAuth Setup

This document explains how to set up OAuth authentication for the social media platforms in the Taskquer mini-app.

## Overview

The social media section now uses proper OAuth flows instead of manual URL input. When users tap "Connect" on any platform, they'll be redirected to the official OAuth page for that platform to authenticate and link their account.

## Required Environment Variables

Create a `.env.local` file in the `client` directory with the following variables:

```bash
# Facebook OAuth
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# Twitter OAuth
VITE_TWITTER_CLIENT_ID=your-twitter-client-id

# YouTube OAuth (Google)
VITE_YOUTUBE_CLIENT_ID=your-youtube-client-id

# Discord OAuth
VITE_DISCORD_CLIENT_ID=your-discord-client-id

# TikTok OAuth
VITE_TIKTOK_CLIENT_ID=your-tiktok-client-id
```

## Platform-Specific Setup

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy the App ID

### Twitter
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Configure callback URLs
5. Copy the Client ID

### YouTube (Google)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Configure authorized redirect URIs
6. Copy the Client ID

### Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Configure redirect URIs
5. Copy the Client ID

### TikTok
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Configure OAuth settings
4. Set redirect URIs
5. Copy the Client Key

## How It Works

1. **Connect Flow**: User taps "Connect" → Redirected to platform OAuth → User authorizes → Redirected back with auth code
2. **Backend Processing**: Auth code is sent to your backend to exchange for access token
3. **Account Linking**: User's account is linked and stored in your database
4. **UI Update**: Social media section shows connected status and username

## Security Notes

- Never expose OAuth secrets in client-side code
- Always use HTTPS in production
- Implement proper state parameter validation
- Store access tokens securely on your backend
- Implement token refresh logic

## Testing

For development, you can use the demo mode which simulates successful connections. In production, ensure all OAuth flows are properly configured with your backend API endpoints.
