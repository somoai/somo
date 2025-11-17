/**
 * Permissions Manager
 *
 * Handles audio and microphone permissions for iOS and Android.
 * Required for voice tutoring feature.
 */

import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';

export class PermissionsManager {
  /**
   * Request microphone permission
   * Handles both iOS and Android platforms
   */
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'SomoAI needs access to your microphone for voice tutoring',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS - Permission is requested automatically on first use
        // We just return true here; actual request happens when recording starts
        return true;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is granted
   */
  static async hasMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        return result;
      } else {
        // iOS - We can't check permission status before first request
        // Return true and let the system handle it
        return true;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Show permission denied alert with option to open settings
   */
  static showPermissionDeniedAlert(): void {
    Alert.alert(
      'Microphone Permission Required',
      'Voice tutoring requires microphone access. Please enable it in your device settings.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Open Settings',
          onPress: () => {
            // Open app settings
            Linking.openSettings();
          },
        },
      ],
    );
  }

  /**
   * Show permission explanation before requesting
   */
  static showPermissionRationale(): Promise<boolean> {
    return new Promise(resolve => {
      Alert.alert(
        '🎙️ Microphone Access',
        'SomoAI Voice Tutor needs microphone access to:\n\n• Listen to your questions\n• Provide real-time voice responses\n• Help you learn by talking naturally\n\nYour voice is never recorded or stored.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Allow',
            onPress: () => resolve(true),
          },
        ],
      );
    });
  }

  /**
   * Request permission with explanation
   */
  static async requestMicrophoneWithRationale(): Promise<boolean> {
    // Show rationale first
    const shouldRequest = await this.showPermissionRationale();

    if (!shouldRequest) {
      return false;
    }

    // Request permission
    return await this.requestMicrophonePermission();
  }
}
