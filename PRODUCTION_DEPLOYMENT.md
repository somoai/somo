# SomoAI Production Deployment Guide

Complete guide for deploying SomoAI backend and mobile apps to production.

## Table of Contents

1. [Backend Deployment](#backend-deployment)
2. [Mobile App Production Build](#mobile-app-production-build)
3. [Store Submission](#store-submission)
4. [Post-Deployment](#post-deployment)

---

## Backend Deployment

### Prerequisites

1. **Railway Account** (or DigitalOcean/AWS)
   - Sign up at https://railway.app
   - Install Railway CLI: `npm install -g @railway/cli`

2. **Required Services**
   - PostgreSQL database
   - Redis cache
   - Africa's Talking account
   - OpenAI API account

### Step 1: Environment Variables

Set these environment variables in Railway dashboard:

```bash
# Django
SECRET_KEY=<generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'>
DJANGO_SETTINGS_MODULE=somoai_backend.settings_production
DEBUG=False
ALLOWED_HOSTS=api.somoai.co.ke,somoai-backend.railway.app

# Database (Railway auto-provides these)
# PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT

# Africa's Talking
AFRICAS_TALKING_API_KEY=<your-production-key>
AFRICAS_TALKING_USERNAME=<your-username>
AFRICAS_TALKING_SHORTCODE=22500

# OpenAI
OPENAI_API_KEY=sk-<your-key>

# Email
EMAIL_HOST_USER=somoai@gmail.com
EMAIL_HOST_PASSWORD=<app-specific-password>
```

### Step 2: Deploy to Railway

```bash
# Login to Railway
railway login

# Link to your project (or create new)
railway link

# Deploy
./deploy.sh
```

### Step 3: Post-Deployment

```bash
# Create superuser
railway run python manage.py createsuperuser

# Test the API
python test_production.py --url https://your-app.railway.app

# Check health
curl https://your-app.railway.app/health/
```

### Step 4: Custom Domain (Optional)

1. In Railway dashboard, go to Settings > Domains
2. Add custom domain: `api.somoai.co.ke`
3. Update DNS records as instructed
4. Add domain to ALLOWED_HOSTS environment variable

### Step 5: Configure Webhooks

Update Africa's Talking webhook URLs:
- SMS Callback: `https://api.somoai.co.ke/api/channels/sms/callback/`
- Delivery Reports: `https://api.somoai.co.ke/api/channels/sms/delivery/`

---

## Mobile App Production Build

### Android Production Setup

#### 1. Generate Signing Key

```bash
cd mobile/SomoAIMobile/android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore somoai-release-key.keystore \
  -alias somoai-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# IMPORTANT: Save the keystore password securely!
```

#### 2. Configure Gradle

Edit `android/gradle.properties`:

```properties
SOMOAI_UPLOAD_STORE_FILE=somoai-release-key.keystore
SOMOAI_UPLOAD_KEY_ALIAS=somoai-key
SOMOAI_UPLOAD_STORE_PASSWORD=<your-keystore-password>
SOMOAI_UPLOAD_KEY_PASSWORD=<your-key-password>

# Enable optimizations
hermesEnabled=true
android.enableR8.fullMode=true
```

#### 3. Update Build Config

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.somoai.app"
        versionCode 1
        versionName "1.0.0"
    }

    signingConfigs {
        release {
            if (project.hasProperty('SOMOAI_UPLOAD_STORE_FILE')) {
                storeFile file(SOMOAI_UPLOAD_STORE_FILE)
                storePassword SOMOAI_UPLOAD_STORE_PASSWORD
                keyAlias SOMOAI_UPLOAD_KEY_ALIAS
                keyPassword SOMOAI_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Build Release

```bash
cd mobile/SomoAIMobile

# Build APK (for testing)
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease

# Outputs:
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS Production Setup

#### 1. Configure Info.plist

Edit `ios/SomoAIMobile/Info.plist`:

```xml
<key>CFBundleDisplayName</key>
<string>SomoAI</string>
<key>CFBundleIdentifier</key>
<string>com.somoai.app</string>
<key>CFBundleVersion</key>
<string>1</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>

<!-- Camera permission -->
<key>NSCameraUsageDescription</key>
<string>SomoAI needs camera access to help you with homework by analyzing photos</string>
```

#### 2. Build Archive

```bash
cd mobile/SomoAIMobile/ios

# Install pods
pod install

# Build (requires Xcode and Apple Developer account)
xcodebuild archive \
  -workspace SomoAIMobile.xcworkspace \
  -scheme SomoAIMobile \
  -configuration Release \
  -archivePath builds/SomoAI.xcarchive

# Upload to App Store Connect using Xcode or Transporter app
```

### Production Environment

Create `.env.production`:

```bash
API_BASE_URL=https://api.somoai.co.ke/api
OPENAI_API_KEY=<your-production-key>
ENVIRONMENT=production
```

---

## Store Submission

### Google Play Store

#### 1. Create App Listing

- **App Name**: SomoAI - Learn Smarter
- **Short Description**: Your personal AI tutor for Math, English, Science. Learn anytime, anywhere! 🎓
- **Category**: Education
- **Content Rating**: Everyone
- **Privacy Policy**: https://somoai.co.ke/privacy
- **Email**: support@somoai.co.ke

#### 2. Required Assets

**App Icon**:
- 512x512 PNG, 32-bit, no alpha

**Screenshots** (at least 2, up to 8):
- Phone: 1080x1920px or larger
- 7-inch tablet: 1920x1200px
- 10-inch tablet: 2560x1536px

**Feature Graphic**:
- 1024x500 PNG/JPEG

#### 3. Upload AAB

```bash
# Upload the AAB file from:
android/app/build/outputs/bundle/release/app-release.aab
```

#### 4. Create Internal/Alpha Release

Before going to production:
1. Create Internal Testing track
2. Add test users
3. Test thoroughly
4. Move to Alpha/Beta
5. Finally, promote to Production

### Apple App Store

#### 1. Create App in App Store Connect

- **Name**: SomoAI
- **Bundle ID**: com.somoai.app
- **SKU**: somoai-1
- **Category**: Education

#### 2. Required Information

- **Privacy Policy URL**: https://somoai.co.ke/privacy
- **Support URL**: https://somoai.co.ke/support
- **Marketing URL**: https://somoai.co.ke
- **Copyright**: © 2025 SomoAI

#### 3. Screenshots

Required sizes:
- 6.7" (iPhone 14 Pro Max): 1290x2796px
- 6.5" (iPhone 11 Pro Max): 1242x2688px
- 5.5" (iPhone 8 Plus): 1242x2208px
- 12.9" iPad Pro: 2048x2732px

#### 4. Upload Build

1. Archive in Xcode
2. Upload to App Store Connect
3. Wait for processing
4. Select build for release
5. Submit for review

---

## Release Checklist

### Pre-Build

- [ ] Update version in app.json
- [ ] Update version in build.gradle (Android)
- [ ] Update version in Info.plist (iOS)
- [ ] Set production API URL
- [ ] Add production OpenAI API key
- [ ] Test with production backend
- [ ] Remove all console.logs
- [ ] Remove debug code

### Functionality Testing

- [ ] Registration flow (phone + OTP)
- [ ] All 7 onboarding screens
- [ ] Home screen loads correctly
- [ ] Can browse lessons
- [ ] Can take a lesson
- [ ] Progress tracking updates
- [ ] AI Tutor conversations work
- [ ] Settings screen functional
- [ ] Logout works
- [ ] Token refresh works

### Edge Cases

- [ ] Poor network (2G/3G)
- [ ] No network (offline mode)
- [ ] Invalid phone numbers
- [ ] Expired OTP
- [ ] API errors
- [ ] App backgrounding/foregrounding
- [ ] Memory management

### Performance

- [ ] App launches in <3 seconds
- [ ] No memory leaks
- [ ] Smooth animations (60fps)
- [ ] Images load quickly
- [ ] API calls optimized

### Android Specific

- [ ] Test on different screen sizes
- [ ] Test on Android 8, 10, 12, 13
- [ ] Back button navigation
- [ ] Deep links work
- [ ] ProGuard doesn't break anything

### iOS Specific

- [ ] Test on iPhone SE, 12, 14
- [ ] Test on iOS 14, 15, 16
- [ ] Notch handling
- [ ] App icons all sizes

### Store Submission

- [ ] Screenshots (5-8 per platform)
- [ ] Feature graphic (Play Store)
- [ ] App icon (512x512 PNG)
- [ ] Privacy policy URL live
- [ ] Terms of service URL live
- [ ] Support email active
- [ ] Age rating: 4+ (Education)
- [ ] Content rating completed

---

## Post-Deployment

### Monitoring

1. **Health Checks**
   ```bash
   # Check every 5 minutes
   */5 * * * * curl https://api.somoai.co.ke/health/
   ```

2. **Error Tracking**
   - Set up Sentry (optional)
   - Monitor Railway logs: `railway logs`

3. **Usage Monitoring**
   ```bash
   curl https://api.somoai.co.ke/stats/
   ```

### Maintenance

1. **Database Backups**
   - Railway auto-backups PostgreSQL
   - Test restore procedure monthly

2. **Security Updates**
   ```bash
   # Update dependencies monthly
   pip list --outdated
   npm outdated
   ```

3. **Performance Monitoring**
   - Monitor response times
   - Track API rate limits
   - Monitor OpenAI costs

### Support

- **Email**: support@somoai.co.ke
- **Response Time**: 24 hours
- **Documentation**: https://docs.somoai.co.ke

---

## Troubleshooting

### Common Issues

**Backend won't start**:
- Check Railway logs: `railway logs`
- Verify environment variables
- Check database connection

**Mobile app can't connect**:
- Verify API_BASE_URL
- Check CORS settings
- Test with curl/Postman first

**OTP not sending**:
- Check Africa's Talking balance
- Verify API credentials
- Check webhook configuration

**High OpenAI costs**:
- Monitor usage in stats endpoint
- Implement rate limiting
- Cache common responses

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** everywhere
4. **Set strong SECRET_KEY** (50+ random characters)
5. **Rotate credentials** quarterly
6. **Monitor for suspicious activity**
7. **Keep dependencies updated**
8. **Implement rate limiting**
9. **Use secure password hashing** (Django default is good)
10. **Backup database** regularly

---

## Cost Estimates

### Railway (Backend)
- Starter Plan: $5/month
- Pro Plan: $20/month (recommended)
- Database: Included
- Redis: Included

### Africa's Talking
- SMS: ~KES 0.80 per message
- Estimate: KES 40,000/month for 50,000 messages

### OpenAI
- GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Estimate: $200/month for moderate usage

### App Store Fees
- Google Play: $25 one-time
- Apple App Store: $99/year

**Total Monthly Cost**: ~$250-300 USD

---

## Next Steps

1. Deploy backend to Railway
2. Test all endpoints
3. Build mobile apps
4. Internal testing (TestFlight/Internal Testing)
5. Beta testing
6. Submit to stores
7. Launch marketing campaign
8. Monitor and iterate

---

## Support

Need help? Contact:
- **Email**: admin@somoai.co.ke
- **GitHub**: https://github.com/somoai
- **Docs**: https://docs.somoai.co.ke

---

**Last Updated**: November 2025
**Version**: 1.0.0
