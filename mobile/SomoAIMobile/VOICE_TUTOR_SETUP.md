# Voice Tutoring Setup Guide

Complete setup instructions for the SomoAI Voice Tutoring feature with ElevenLabs Conversational AI.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Cost Management](#cost-management)

---

## Overview

The Voice Tutoring feature provides real-time voice conversations between students and an AI tutor powered by ElevenLabs Conversational AI. It includes:

- **Real-time voice conversations** - Natural voice interaction with turn-taking
- **Kenyan context** - Teaching style adapted for Kenyan students
- **Code-switching** - Natural use of English and Kiswahili
- **Socratic method** - Guides students to discover answers
- **Usage tracking** - Tier-based limits (Free: 5 min/day, Premium: 60 min/day)
- **Session management** - Start, pause, resume, and end sessions
- **Live transcripts** - Real-time display of conversation
- **Cost tracking** - Monitor API usage and costs

---

## Prerequisites

Before setting up voice tutoring, ensure you have:

### 1. ElevenLabs Account

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Subscribe to a plan that includes Conversational AI:
   - **Starter Plan**: $5/month - Good for testing
   - **Creator Plan**: $22/month - Better for production
   - **Pro Plan**: $99/month - High volume

### 2. Required Dependencies

The following packages are required (already in `package.json`):

```json
{
  "react-native-audio-recorder-player": "^3.6.0",
  "react-native-fs": "^2.20.0",
  "react-native-haptic-feedback": "^2.2.0",
  "buffer": "^6.0.3"
}
```

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
npm install

# Install iOS pods (iOS only)
cd ios
pod install
cd ..
```

### Step 2: Get ElevenLabs API Key

1. Go to [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
2. Click "Create API Key"
3. Copy your API key
4. Store it securely

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Add your ElevenLabs API key to `.env`:

```env
# ElevenLabs Configuration (for Voice Tutoring)
ELEVENLABS_API_KEY=sk_your_actual_api_key_here
```

**IMPORTANT:** Never commit your `.env` file to version control!

### Step 4: Platform-Specific Setup

#### iOS Setup

1. Add microphone permission to `ios/SomoAIMobile/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>SomoAI needs microphone access for voice tutoring conversations</string>
```

2. The permission is already configured in the app, but verify it's present.

#### Android Setup

1. Add microphone permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

2. The permissions are already configured, but verify they're present.

---

## Configuration

### Voice Configuration

The voice tutor uses these default settings (in `src/constants/config.ts`):

```typescript
export const AI_CONFIG = {
  // ElevenLabs Voice Settings
  ELEVENLABS_API_KEY: ELEVENLABS_API_KEY || '',

  // Session Limits
  VOICE_TUTOR_MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  VOICE_TUTOR_AUTO_END_INACTIVITY: 5 * 60 * 1000,   // 5 minutes

  // Cost Tracking
  VOICE_TUTOR_COST_PER_MINUTE: 0.05, // $0.05/minute

  // Tier Limits
  VOICE_TUTOR_FREE_MINUTES_PER_DAY: 5,    // Free tier
  VOICE_TUTOR_PREMIUM_MINUTES_PER_DAY: 60, // Premium tier
};
```

### Customizing the Voice

To change the AI tutor's voice, edit `src/services/voiceTutor.ts`:

```typescript
voice: {
  voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - warm male voice
  // Other ElevenLabs voices:
  // 'EXAVITQu4vr4xnSDxMaL' - Bella - female
  // '21m00Tcm4TlvDq8ikWAM' - Rachel - female
  // 'AZnzlk1XvdvUeBnXmlld' - Domi - female
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
}
```

Find more voices at [ElevenLabs Voice Library](https://elevenlabs.io/voice-library).

### Customizing the System Prompt

To adjust the AI tutor's teaching style, edit the `systemPrompt` in `src/services/voiceTutor.ts`:

```typescript
const systemPrompt = `You are a friendly, encouraging Kenyan tutor...`;
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

### Step 2: Test Voice Feature

1. Navigate to the **Voice** tab (microphone icon)
2. Tap "Start Session"
3. Grant microphone permission if prompted
4. Wait for connection (you should see "Listening...")
5. Hold the microphone button and speak
6. Release to let AI respond
7. Watch the live transcript and visualizer
8. Tap "End Session" when done

### Step 3: Verify Features

Test these features:

- ✅ Microphone permission request
- ✅ Session start/end
- ✅ Audio recording and playback
- ✅ Real-time transcript display
- ✅ Voice visualizer animation
- ✅ Usage tracking (minutes used/remaining)
- ✅ Haptic feedback
- ✅ Tier limits (try exceeding 5 min on Free tier)
- ✅ Turn-taking (user ↔ AI)
- ✅ Error handling

### Common Test Scenarios

1. **Permission Denied:**
   - Deny microphone permission
   - Verify alert with "Open Settings" option

2. **Network Error:**
   - Turn off internet
   - Try starting session
   - Verify error message

3. **Limit Reached:**
   - Use 5 minutes on Free tier
   - Verify auto-end and upgrade prompt

4. **Session Interruption:**
   - Start session
   - Close app
   - Reopen app
   - Verify cleanup

---

## Usage

### Starting a Voice Session

```typescript
import voiceTutorService from '@services/voiceTutor';

const session = await voiceTutorService.createVoiceSession({
  id: student.id,
  name: student.first_name,
  grade: student.grade_level,
  language: student.preferred_language,
}, 'Algebra equations'); // Optional topic
```

### Ending a Session

```typescript
const minutesUsed = await voiceTutorService.endSession(sessionId);
console.log(`Session ended. Used ${minutesUsed} minutes`);
```

### Checking Usage Limits

```typescript
import {useSelector} from 'react-redux';
import {selectHasReachedVoiceLimit, selectRemainingMinutes} from '@store/slices/voiceSlice';

const hasReachedLimit = useSelector(selectHasReachedVoiceLimit);
const remainingMinutes = useSelector(selectRemainingMinutes);

if (hasReachedLimit) {
  console.log('Daily limit reached!');
} else {
  console.log(`${remainingMinutes} minutes remaining`);
}
```

---

## Troubleshooting

### "ElevenLabs API key not configured"

**Problem:** API key is missing or incorrect.

**Solution:**
1. Check `.env` file exists
2. Verify `ELEVENLABS_API_KEY=sk_...` is set
3. Restart Metro bundler: `npm start -- --reset-cache`
4. Rebuild app

### "Could not start recording"

**Problem:** Microphone permission denied.

**Solution:**
1. Go to device Settings → Apps → SomoAI
2. Enable Microphone permission
3. Restart app

### "Connection error"

**Problem:** Network issues or API down.

**Solution:**
1. Check internet connection
2. Verify ElevenLabs API status
3. Check API key is valid
4. Ensure you have API credits

### Audio not playing

**Problem:** Audio playback issues.

**Solution:**
1. Check device volume
2. Ensure headphones not connected (if not intended)
3. Restart app
4. Clear app cache

### Transcript not updating

**Problem:** WebSocket connection issues.

**Solution:**
1. Check network connection
2. Restart session
3. Check browser console for errors
4. Verify API key has WebSocket permissions

### High API costs

**Problem:** Unexpected API usage.

**Solution:**
1. Check `dailyUsage` in Redux state
2. Implement stricter tier limits
3. Reduce `max_tokens` in config
4. Use cheaper voice model (eleven_turbo_v2)

---

## Cost Management

### ElevenLabs Pricing

**Conversational AI costs** (as of 2024):

- **Audio Generation:** ~$0.24 per 1,000 characters
- **WebSocket Streaming:** Included in subscription
- **Voice Activity Detection:** Included in subscription

**Estimated costs:**

| Tier | Daily Limit | Cost/Day | Cost/Month |
|------|------------|----------|------------|
| Free | 5 minutes | $0.25 | $7.50 |
| Premium | 60 minutes | $3.00 | $90.00 |

### Optimization Tips

1. **Use eleven_turbo_v2 model** (faster, cheaper)
2. **Limit max_tokens** to 150 (keeps responses concise)
3. **Set session duration limits** (30 min max)
4. **Auto-end on inactivity** (5 min idle)
5. **Track usage in Redux** (daily limits)
6. **Monitor API usage** in ElevenLabs dashboard

### Monitoring Costs

Check usage in ElevenLabs dashboard:

1. Go to [ElevenLabs Usage](https://elevenlabs.io/app/usage)
2. View character usage and costs
3. Set up billing alerts
4. Download usage reports

---

## Architecture

### Components

```
src/
├── components/voice/
│   └── VoiceVisualizer.tsx      # Animated voice visualizer
├── screens/voice/
│   └── VoiceChatScreen.tsx      # Main voice chat UI
├── services/
│   ├── voiceTutor.ts            # ElevenLabs API integration
│   ├── audioRecorder.ts         # Audio recording/playback
│   └── elevenLabsWebSocket.ts   # WebSocket client
├── store/slices/
│   └── voiceSlice.ts            # Redux state management
└── utils/
    ├── permissions.ts           # Microphone permissions
    └── haptics.ts               # Haptic feedback
```

### Data Flow

```
User speaks → AudioRecorder → WebSocket → ElevenLabs API
                                              ↓
User hears ← AudioRecorder ← WebSocket ← AI Response
```

### State Management

- **Redux:** Session state, usage tracking, tier management
- **Local State:** UI state, transcript, connection status
- **AsyncStorage:** Persistent usage data

---

## Support

### Documentation

- [ElevenLabs Docs](https://elevenlabs.io/docs)
- [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference)
- [React Native Audio Recorder](https://github.com/hyochan/react-native-audio-recorder-player)

### Contact

- Report issues on GitHub
- Email: support@somoai.co.ke

---

## License

This feature is part of SomoAI and follows the same license.

---

**Built with ❤️ for Kenyan students**
