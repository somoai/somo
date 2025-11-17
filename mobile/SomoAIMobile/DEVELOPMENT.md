# SomoAI Mobile App - Development Guide

Comprehensive guide for developing the SomoAI mobile application.

## 🏗️ Architecture

### Tech Stack

- **React Native 0.73** - Mobile framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Native Paper** - Material Design components
- **React Native Reanimated** - Smooth animations
- **AsyncStorage** - Local data persistence

### Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Design system components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ProgressBar.tsx
├── constants/          # App configuration
│   ├── config.ts       # API & app settings
│   └── theme.ts        # Design tokens
├── navigation/         # React Navigation setup
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   └── main/         # Main app screens
├── services/          # Business logic
│   ├── api.ts        # API client
│   ├── storage.ts    # AsyncStorage wrapper
│   └── networkMonitor.ts
├── store/             # Redux store
│   └── slices/       # Redux slices
├── types/             # TypeScript definitions
│   └── api.ts        # API types
└── utils/             # Helper functions
```

---

## 🔌 API Service

### Overview

The API service (`src/services/api.ts`) provides a complete HTTP client with:

- **JWT Authentication** - Automatic token injection and refresh
- **Offline Queue** - Failed requests are queued and retried
- **Error Handling** - Typed errors with user-friendly messages
- **Network Monitoring** - Automatic detection of connectivity
- **Request Logging** - Development-mode logging

### Usage

```typescript
import {api} from '@services';

// Authentication
const otpResponse = await api.requestOTP('+254712345678');
const verifyResponse = await api.verifyOTP('+254712345678', '123456');
const registerResponse = await api.register({
  phone_number: '+254712345678',
  otp_id: verifyResponse.otp_id,
  name: 'Alice Wanjiru',
  grade_level: 4,
});

// Learning
const nextLesson = await api.getNextLesson('MATH');
const progress = await api.getProgress();

// Content
const subjects = await api.getSubjects();
```

### Error Handling

```typescript
import {APIError, APIErrorCode} from '@services';

try {
  await api.requestOTP(phoneNumber);
} catch (error) {
  if (error instanceof APIError) {
    // Show user-friendly message
    Alert.alert('Error', error.userMessage);

    // Check if recoverable
    if (error.isRecoverable()) {
      // Retry logic
    }

    // Check if requires re-authentication
    if (error.requiresAuth()) {
      // Navigate to login
    }
  }
}
```

### Offline Support

Requests are automatically queued when offline:

```typescript
// This will be queued if offline and retried when connection returns
await api.submitLesson(lessonId, answers);
```

---

## 🎨 Design System

### Theme

All design tokens are defined in `src/constants/theme.ts`:

```typescript
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

// Colors
Colors.primary         // #0099FF (Bright Blue)
Colors.secondary       // #FF6B9D (Pink)
Colors.text           // #1A1D29 (Dark Navy)
Colors.success        // #10B981 (Green)
Colors.error          // #EF4444 (Red)

// Typography
Typography.sizes.xl   // 24px
Typography.weights.semibold

// Spacing
Spacing.base          // 16px
Spacing.lg            // 24px

// Border Radius
BorderRadius.md       // 12px
```

### Components

#### Button

Primary button with multiple variants and states:

```typescript
import {Button} from '@components/ui';

// Primary Button
<Button
  title="Continue"
  onPress={handleContinue}
  variant="primary"
  size="large"
  fullWidth
/>

// Outline Button
<Button
  title="Skip"
  onPress={handleSkip}
  variant="outline"
  size="medium"
/>

// Loading State
<Button
  title="Submitting..."
  onPress={handleSubmit}
  loading={isSubmitting}
  disabled={isSubmitting}
/>

// With Icon
<Button
  title="Next"
  onPress={handleNext}
  icon={<Icon name="arrow-forward" size={20} />}
/>
```

**Props:**
- `title` (string) - Button text
- `onPress` (function) - Press handler
- `variant` ('primary' | 'secondary' | 'outline' | 'text' | 'danger')
- `size` ('small' | 'medium' | 'large')
- `loading` (boolean) - Show spinner
- `disabled` (boolean) - Disable button
- `icon` (ReactNode) - Left icon
- `iconRight` (ReactNode) - Right icon
- `fullWidth` (boolean) - Full width (default: true)
- `hapticFeedback` (boolean) - Haptic on press (default: true)

**Features:**
- ✅ Smooth press animation (scale: 0.98)
- ✅ Haptic feedback on press
- ✅ Loading spinner replaces content
- ✅ Disabled state with 50% opacity
- ✅ Multiple size and color variants

---

#### Input

Text input with phone formatting and validation:

```typescript
import {Input} from '@components/ui';

// Phone Number Input
<Input
  value={phoneNumber}
  onChangeText={setPhoneNumber}
  placeholder="Enter phone number"
  keyboardType="phone-pad"
  autoFormat="phone"  // Auto-formats to +254 7XX XXX XXX
  error={errors.phone}
  label="Phone Number"
/>

// Regular Text Input
<Input
  value={name}
  onChangeText={setName}
  placeholder="Your name"
  label="Full Name"
  helperText="Enter your full name as it appears on your school ID"
/>

// With Icons
<Input
  value={email}
  onChangeText={setEmail}
  icon={<Icon name="mail" size={20} />}
  iconRight={<Icon name="checkmark-circle" size={20} color="green" />}
/>
```

**Props:**
- `value` (string) - Input value
- `onChangeText` (function) - Change handler
- `placeholder` (string) - Placeholder text
- `autoFormat` ('phone' | 'none') - Auto-formatting
- `error` (string) - Error message
- `label` (string) - Label text
- `helperText` (string) - Helper text below input
- `icon` (ReactNode) - Left icon
- `iconRight` (ReactNode) - Right icon
- `showClearButton` (boolean) - Show clear button (default: true)
- `size` ('small' | 'medium' | 'large')
- `disabled` (boolean) - Disabled state

**Features:**
- ✅ Auto-formats Kenyan phone numbers (+254 7XX XXX XXX)
- ✅ Animated border color on focus (blue)
- ✅ Error state with red border and message
- ✅ Clear button when has value
- ✅ Label and helper text support

---

#### ProgressBar

Segmented progress indicator for multi-step flows:

```typescript
import {ProgressBar} from '@components/ui';

<ProgressBar
  currentStep={2}
  totalSteps={6}
  color={Colors.primary}
/>
```

**Props:**
- `currentStep` (number) - Current step (1-indexed)
- `totalSteps` (number) - Total steps
- `color` (string) - Filled segment color
- `backgroundColor` (string) - Unfilled segment color
- `height` (number) - Segment height (default: 4)
- `gap` (number) - Gap between segments (default: 4)
- `animated` (boolean) - Enable animations (default: true)

**Features:**
- ✅ Smooth fill animations
- ✅ Automatically calculated segment width
- ✅ Customizable colors and sizing
- ✅ Staggered animation for segments

---

## 🗂️ Storage Service

AsyncStorage wrapper with automatic JSON serialization:

```typescript
import {storage} from '@services';

// Save data
await storage.saveTokens({access: 'token...', refresh: 'token...'});
await storage.saveStudent(studentProfile);

// Retrieve data
const tokens = await storage.getTokens();
const student = await storage.getStudent();

// Clear data
await storage.clearTokens();
await storage.clearAllAppData(); // Logout
```

---

## 🌐 Network Monitoring

Monitor connectivity and connection quality:

```typescript
import {NetworkMonitor} from '@services';

// Check connectivity
const status = await NetworkMonitor.checkConnectivity();
if (status === 'offline') {
  Alert.alert('No internet connection');
}

// Get connection quality
const quality = await NetworkMonitor.getConnectionQuality();
// Returns: 'excellent' | 'good' | 'poor' | 'offline'

// Listen for changes
const unsubscribe = NetworkMonitor.onConnectivityChange((state) => {
  console.log('Network state:', state.quality);

  if (state.isConnected) {
    // Sync offline data
  }
});

// Cleanup
unsubscribe();

// Wait for connection
try {
  await NetworkMonitor.waitForConnection(10000); // 10 seconds
  // Now online
} catch {
  // Still offline
}
```

---

## 📱 Running the App

### Development

```bash
# Install dependencies
npm install

# iOS (Mac only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android

# Metro bundler
npm start
```

### Environment Setup

Create `.env` file:

```env
# For Android Emulator
API_BASE_URL=http://10.0.2.2:8000

# For iOS Simulator
# API_BASE_URL=http://localhost:8000

# For Physical Device (use your computer's IP)
# API_BASE_URL=http://192.168.1.100:8000

API_TIMEOUT=15000
```

### Backend Setup

Ensure Django backend is running:

```bash
cd /home/user/somo
python manage.py runserver 8000
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📝 Code Style

- **TypeScript** - All code must be typed
- **Functional Components** - Use hooks, not class components
- **JSDoc Comments** - Document all public APIs
- **Consistent Naming** - camelCase for variables, PascalCase for components
- **Import Order** - React → Third-party → Local → Types

Example:

```typescript
/**
 * Component description
 *
 * @example
 * ```tsx
 * <MyComponent prop="value" />
 * ```
 */
export const MyComponent: React.FC<Props> = ({prop}) => {
  // Implementation
};
```

---

## 🔐 Security

- ✅ JWT tokens stored in encrypted AsyncStorage
- ✅ Automatic token refresh on 401
- ✅ Secure API communication (HTTPS in production)
- ✅ No sensitive data in logs
- ✅ Phone number validation and sanitization

---

## 🚀 Next Steps

1. **Redux Store Setup** - Configure global state management
2. **Authentication Screens** - PhoneNumber, OTP, Registration
3. **Main App Screens** - Home, Lesson, Progress, Settings
4. **Navigation** - React Navigation setup
5. **Push Notifications** - Firebase Cloud Messaging
6. **Offline Sync** - Background sync when online
7. **Analytics** - Track user engagement
8. **Testing** - Unit and integration tests

---

## 📚 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Redux Toolkit](https://redux-toolkit.js.org/introduction/getting-started)
- [Material Design](https://material.io/design)

---

**Built with ❤️ for Kenyan students**
