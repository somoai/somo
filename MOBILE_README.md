# SomoAI Mobile App

React Native mobile application for the SomoAI education platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- For iOS: Xcode (macOS only)
- For Android: Android Studio

### Installation

```bash
# Install dependencies
npm install

# iOS only - Install pods
cd ios && pod install && cd ..
```

### Running the App

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Start Metro bundler
npm start
```

## 📁 Project Structure

```
src/
├── navigation/          # React Navigation setup
├── screens/            # All screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── components/         # Reusable components
├── services/          # API, storage, sync
│   ├── api.ts        # API client
│   ├── auth.ts       # Auth service
│   ├── storage.ts    # AsyncStorage wrapper
│   └── sync.ts       # Offline sync
├── store/             # Redux Toolkit store
│   └── slices/       # Redux slices
├── types/             # TypeScript types
├── utils/             # Helper functions
└── constants/         # Config, colors, themes
```

## 🔌 Backend Configuration

The app connects to the SomoAI Django backend API.

### Environment Setup

Create a `.env` file in the root directory:

```env
# For Android Emulator
API_BASE_URL=http://10.0.2.2:8000

# For iOS Simulator
# API_BASE_URL=http://localhost:8000

# For Physical Device (replace with your computer's local IP)
# API_BASE_URL=http://192.168.1.100:8000
```

### Backend Setup

1. Ensure the Django backend is running:
```bash
cd ../backend
source venv/bin/activate
python manage.py runserver 8000
```

2. Test API connectivity:
```bash
curl http://localhost:8000/api/schema/
```

## 🎨 Features

- ✅ **Phone-based Authentication** - OTP verification
- ✅ **JWT Token Management** - Secure authentication
- ✅ **Adaptive Learning** - Personalized lesson recommendations
- ✅ **Progress Tracking** - Streak counting, mastery levels
- ✅ **Offline Support** - Learn without internet
- ✅ **Swahili/English** - Bilingual support
- ✅ **Grade 1-8** - Full primary school curriculum

## 📱 Screens

### Authentication Flow
- **PhoneNumberScreen** - Enter phone number
- **OTPScreen** - Verify OTP code
- **RegistrationScreen** - Complete profile (new users)

### Main App
- **HomeScreen** - Dashboard with next lesson
- **LessonScreen** - Interactive lesson with questions
- **ProgressScreen** - Stats, streaks, mastery
- **SettingsScreen** - Profile, language, preferences

## 🔐 Authentication Flow

```
1. User enters phone number (+254...)
2. Backend sends OTP via SMS
3. User enters OTP code
4. Backend verifies OTP
   - Existing user: Returns JWT tokens → Home
   - New user: Returns otp_id → Registration
5. New user completes profile
6. Backend returns JWT tokens → Home
7. All API calls use JWT Bearer token
```

## 🛠 Development

### TypeScript

This project uses TypeScript for type safety. All API responses, Redux state, and component props are fully typed.

### State Management

Redux Toolkit with Redux Persist:
- **authSlice** - Authentication state and tokens
- **lessonSlice** - Current lesson and attempts
- **progressSlice** - Progress summary and streaks

### API Client

Axios-based client with:
- Automatic JWT token injection
- Token refresh on 401
- Request queuing for offline
- Typed responses

### Styling

React Native Paper for Material Design components with custom Kenyan theme colors:
- Primary: Green (#006400)
- Accent: Red (#DC143C)
- Background: White (#FFFFFF)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 Building

### Android APK

```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA (macOS only)

```bash
# Open Xcode
open ios/SomoAIMobile.xcworkspace

# Archive and export from Xcode
# Product → Archive → Distribute App
```

## 🌍 Localization

Support for English and Swahili:
- Uses i18n for translations
- Language selector in settings
- RTL support ready

## 📊 Analytics (Future)

Planned integrations:
- Firebase Analytics
- Crashlytics
- Performance monitoring

## 🔒 Security

- JWT tokens stored in encrypted AsyncStorage
- Automatic token refresh
- Secure API communication (HTTPS in production)
- No sensitive data in logs

## 🚀 Deployment

### TestFlight (iOS)

1. Build archive in Xcode
2. Upload to App Store Connect
3. Submit for TestFlight review
4. Share TestFlight link

### Google Play (Android)

1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Create internal/closed testing track
4. Submit for review

## 🤝 Contributing

This is an education platform for Kenyan students. Contributions welcome!

## 📄 License

Proprietary - SomoAI Education Platform

## 📞 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for Kenyan students**
