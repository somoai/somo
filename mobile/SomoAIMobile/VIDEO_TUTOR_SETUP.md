# Video Tutoring Setup Guide

Complete setup instructions for the SomoAI Video Tutoring feature with Tavus.io photorealistic AI teachers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Cost Management](#cost-management)
- [Architecture](#architecture)

---

## Overview

The Video Tutoring feature provides real-time video conversations between students and photorealistic AI teacher avatars powered by Tavus.io. It includes:

- **Photorealistic Kenyan teachers** - Meet Miss Wanjiru (Math), Mr. Kipchoge (Science), and Miss Amina (English)
- **Real-time video streaming** - Face-to-face conversations with natural gestures and expressions
- **Visual teaching** - Teachers use hand gestures, facial expressions, and body language
- **Kenyan context** - Teaching style adapted for Kenyan students with local examples
- **Code-switching** - Natural use of English and Kiswahili
- **Socratic method** - Guides students to discover answers through questions
- **Session management** - Start, pause, resume, and end sessions
- **Usage tracking** - Tier-based limits (Premium: 60 min/day)
- **Cost tracking** - Monitor API usage and costs ($2/minute)
- **Premium feature** - Available for Premium subscribers (Ksh 299/month or $2.99/month)

---

## Prerequisites

Before setting up video tutoring, ensure you have:

### 1. Tavus Account

1. Go to [Tavus.io](https://tavus.io/)
2. Sign up for an account
3. Subscribe to a plan that includes Conversational Video API:
   - **Developer Plan**: $99/month - Good for testing
   - **Business Plan**: Custom pricing - For production

### 2. Required Dependencies

The following packages are required:

```bash
npm install react-native-webview
npm install react-native-linear-gradient
```

Already installed from voice tutoring:
- `@reduxjs/toolkit`
- `@react-native-async-storage/async-storage`
- `react-native-vector-icons`

### 3. Platform Requirements

**iOS:**
- Xcode 14.0+
- iOS 13.0+
- CocoaPods installed

**Android:**
- Android Studio
- Android SDK 21+
- Gradle 7.0+

---

## Installation

### Step 1: Install Dependencies

```bash
cd mobile/SomoAIMobile

# Install npm packages
npm install react-native-webview react-native-linear-gradient

# Install iOS pods (iOS only)
cd ios
pod install
cd ..
```

### Step 2: Get Tavus API Key

1. Go to [Tavus Dashboard](https://tavus.io/dashboard/api-keys)
2. Click "Create API Key"
3. Copy your API key
4. Store it securely

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Add your Tavus API key to `.env`:

```env
# Tavus Configuration (for Video Tutoring)
TAVUS_API_KEY=sk_your_actual_tavus_api_key_here
```

**IMPORTANT:** Never commit your `.env` file to version control!

### Step 4: Platform-Specific Setup

#### iOS Setup

1. Add camera permission to `ios/SomoAIMobile/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>SomoAI needs camera access for video tutoring sessions</string>
```

2. Rebuild the iOS app:

```bash
cd ios
pod install
cd ..
npm run ios
```

#### Android Setup

1. Add camera permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

2. Rebuild the Android app:

```bash
npm run android
```

---

## Configuration

### Video Configuration

The video tutor uses these default settings (in `src/constants/config.ts`):

```typescript
export const AI_CONFIG = {
  // Tavus Video Tutor Configuration
  TAVUS_API_KEY: TAVUS_API_KEY || '',

  // Video Tutor Settings
  VIDEO_TUTOR_MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  VIDEO_TUTOR_AUTO_END_INACTIVITY: 5 * 60 * 1000,   // 5 minutes
  VIDEO_TUTOR_COST_PER_MINUTE: 2.0, // USD (Tavus pricing)
  VIDEO_TUTOR_PREMIUM_MINUTES_PER_DAY: 60,
  VIDEO_TUTOR_MIN_TIER: 'premium', // Only premium+ users
  VIDEO_QUALITY: 'hd', // 'sd' | 'hd'
  VIDEO_FRAME_RATE: 30,
};
```

### Customizing Personas

To add or modify teacher personas, edit `src/services/videoTutor.ts`:

```typescript
private initializePersonas(): TavusPersona[] {
  return [
    {
      personaId: 'miss_wanjiru',
      personaName: 'Miss Wanjiru',
      subject: 'MATH',
      avatarUrl: 'https://your-tavus-avatar-url.com/wanjiru.mp4',
      gender: 'female',
      description: 'Experienced Math teacher from Nairobi',
      greeting: "Habari! I'm Miss Wanjiru...",
    },
    // Add more personas here
  ];
}
```

### Customizing Teaching Style

To adjust the AI tutor's teaching approach, edit the `buildSystemPrompt` method in `src/services/videoTutor.ts`:

```typescript
private buildSystemPrompt(
  persona: TavusPersona,
  student: StudentProfile,
  concept?: string,
): string {
  return `You are ${persona.personaName}...

  VISUAL TEACHING (IMPORTANT):
  - Use natural hand gestures
  - Show facial expressions
  - Point to imaginary objects
  ...
  `;
}
```

---

## Testing

### Step 1: Run the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

### Step 2: Test Video Feature

1. Navigate to the **Home** screen
2. Tap the **Video Tutor** card
3. Select a Kenyan teacher persona
4. Wait for session initialization
5. Type a question or message
6. Watch the AI teacher respond with video and text
7. Tap "End Session" when done

### Step 3: Verify Features

Test these features:

- ✅ Persona selection screen
- ✅ Video session initialization
- ✅ WebView video playback
- ✅ Text messaging
- ✅ Live transcript (last 3 messages)
- ✅ Usage tracking (minutes used/remaining)
- ✅ Session end with summary
- ✅ Auto-end at 60 minutes
- ✅ Warning at 55 minutes
- ✅ Premium tier enforcement
- ✅ Error handling
- ✅ Network resilience

### Common Test Scenarios

1. **Network Error:**
   - Turn off internet
   - Try starting session
   - Verify error message

2. **Limit Reached:**
   - Use 60 minutes on Premium tier
   - Verify auto-end and usage summary

3. **Session Interruption:**
   - Start session
   - Close app
   - Reopen app
   - Verify cleanup

---

## Usage

### Starting a Video Session

```typescript
import videoTutorService from '@services/videoTutor';

const session = await videoTutorService.createVideoSession(
  {
    id: student.id,
    name: student.first_name,
    grade: student.grade_level,
    language: student.preferred_language,
  },
  'miss_wanjiru', // Persona ID
  'Algebra equations' // Optional topic
);
```

### Sending Messages

```typescript
const response = await videoTutorService.sendMessage(
  session.sessionId,
  'Can you help me with fractions?'
);

console.log('AI response:', response.content);
console.log('Video URL:', response.videoUrl);
```

### Ending a Session

```typescript
const minutesUsed = await videoTutorService.endSession(session.sessionId);
const cost = videoTutorService.calculateCost(minutesUsed);

console.log(`Session ended. Used ${minutesUsed} minutes. Cost: $${cost}`);
```

### Checking Usage Limits

```typescript
import {useSelector} from 'react-redux';
import {
  selectHasReachedVideoLimit,
  selectRemainingVideoMinutes,
} from '@store/slices/videoSlice';

const hasReachedLimit = useSelector(selectHasReachedVideoLimit);
const remainingMinutes = useSelector(selectRemainingVideoMinutes);

if (hasReachedLimit) {
  console.log('Daily limit reached!');
} else {
  console.log(`${remainingMinutes} minutes remaining`);
}
```

---

## Troubleshooting

### "Tavus API key not configured"

**Problem:** API key is missing or incorrect.

**Solution:**
1. Check `.env` file exists
2. Verify `TAVUS_API_KEY=sk_...` is set
3. Restart Metro bundler: `npm start -- --reset-cache`
4. Rebuild app

### "Could not start video tutor"

**Problem:** Network issues or API down.

**Solution:**
1. Check internet connection
2. Verify Tavus API status
3. Check API key is valid
4. Ensure you have API credits

### Video not loading

**Problem:** WebView issues.

**Solution:**
1. Check device compatibility
2. Update WebView on Android
3. Clear app cache
4. Restart app

### "Session ended unexpectedly"

**Problem:** Network interruption or API error.

**Solution:**
1. Check network stability
2. Verify API limits not exceeded
3. Check Tavus dashboard for errors
4. Try again with better network

### High API costs

**Problem:** Unexpected API usage.

**Solution:**
1. Check `usage` in Redux state
2. Implement stricter daily limits
3. Reduce session duration
4. Monitor Tavus dashboard

---

## Cost Management

### Tavus Pricing

**Conversational Video API costs** (as of 2024):

- **Video Generation:** ~$2.00 per minute
- **WebSocket Streaming:** Included in subscription
- **HD Video (1080p):** Standard rate
- **SD Video (720p):** Lower rate (if available)

**Estimated costs:**

| Tier | Daily Limit | Cost/Day | Cost/Month |
|------|------------|----------|------------|
| Premium | 60 minutes | $120 | $3,600 |

**Cost Optimization:**
- Set daily limits (60 minutes for Premium)
- Auto-end sessions at 30 minutes
- Auto-end on 5 minutes inactivity
- Use SD quality if available
- Monitor usage in Tavus dashboard

### Optimization Tips

1. **Set session duration limits** (30 min max per session)
2. **Auto-end on inactivity** (5 min idle)
3. **Track usage in Redux** (daily limits)
4. **Monitor API usage** in Tavus dashboard
5. **Use SD video quality** for cost savings
6. **Implement rate limiting** to prevent abuse
7. **Cache persona data** to reduce API calls

### Monitoring Costs

Check usage in Tavus dashboard:

1. Go to [Tavus Usage](https://tavus.io/dashboard/usage)
2. View video generation usage and costs
3. Set up billing alerts
4. Download usage reports
5. Track per-student usage

---

## Architecture

### Components

```
src/
├── services/
│   └── videoTutor.ts            # Tavus.io API integration
├── store/slices/
│   └── videoSlice.ts            # Redux state management
├── screens/video/
│   ├── PersonaSelectorScreen.tsx # Choose teacher persona
│   └── VideoChatScreen.tsx      # Video tutoring session
├── constants/
│   └── config.ts                # Configuration settings
└── navigation/
    ├── types.ts                 # Navigation types
    └── RootNavigator.tsx        # Navigation setup
```

### Data Flow

```
User selects persona → PersonaSelectorScreen
                              ↓
                      Create Tavus session
                              ↓
                       VideoChatScreen
                              ↓
        User sends message → Tavus API → AI responds with video
                              ↓
                    WebView displays video
                              ↓
                     Transcript updates
```

### State Management

- **Redux:** Session state, usage tracking, tier management
- **Local State:** UI state, messages, elapsed time
- **AsyncStorage:** Persistent usage data and session history

---

## Known Limitations

1. **Video Quality:** Depends on network bandwidth
2. **Latency:** 2-5 seconds for AI video responses
3. **Cost:** $2/minute makes it expensive for high usage
4. **Platform:** WebView required (iOS 13+, Android 21+)
5. **Offline:** Requires internet connection
6. **Premium Only:** Not available for free tier users

---

## Future Enhancements

- [ ] Add more Kenyan teacher personas
- [ ] Support multiple subjects per persona
- [ ] Add screen sharing for visual explanations
- [ ] Implement whiteboard feature
- [ ] Add session recording and playback
- [ ] Support group tutoring sessions
- [ ] Add parent monitoring dashboard
- [ ] Implement AI-generated homework assignments

---

## Support

### Documentation

- [Tavus.io Docs](https://docs.tavus.io/)
- [Tavus API Reference](https://docs.tavus.io/api-reference)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

### Contact

- Report issues on GitHub
- Email: support@somoai.co.ke
- Tavus Support: support@tavus.io

---

## License

This feature is part of SomoAI and follows the same license.

---

**Built with ❤️ for Kenyan students by SomoAI**

Empowering education through AI technology 🎓🇰🇪
