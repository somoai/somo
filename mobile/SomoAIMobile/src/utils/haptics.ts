/**
 * Haptic Feedback Utility
 *
 * Provides tactile feedback for user interactions:
 * - Selection feedback (light tap)
 * - Success feedback (positive action)
 * - Warning feedback (caution)
 * - Error feedback (negative action)
 * - Impact feedback (physical interaction)
 *
 * Uses React Native Haptic Feedback for iOS and Android
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {Platform} from 'react-native';

/**
 * Haptic feedback options
 */
const hapticOptions = {
  enableVibrateFallback: true, // Use vibration if haptic not available
  ignoreAndroidSystemSettings: false, // Respect system settings on Android
};

/**
 * Haptic Feedback Manager
 */
export class HapticsManager {
  /**
   * Light selection feedback
   * Use for: UI element selection, button taps, switches
   */
  static selection(): void {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  }

  /**
   * Soft impact feedback
   * Use for: Drag and drop, pull to refresh
   */
  static impactLight(): void {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }

  /**
   * Medium impact feedback
   * Use for: List item selection, tab changes
   */
  static impactMedium(): void {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }

  /**
   * Heavy impact feedback
   * Use for: Important actions, confirmations
   */
  static impactHeavy(): void {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  }

  /**
   * Success notification feedback
   * Use for: Task completion, successful save, correct answer
   */
  static success(): void {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  }

  /**
   * Warning notification feedback
   * Use for: Warning alerts, approaching limit
   */
  static warning(): void {
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  }

  /**
   * Error notification feedback
   * Use for: Failed actions, errors, incorrect answer
   */
  static error(): void {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  }

  /**
   * Rigid impact feedback (iOS only)
   * Use for: Precise interactions
   */
  static rigid(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('rigid', hapticOptions);
    } else {
      // Fallback to medium impact on Android
      HapticsManager.impactMedium();
    }
  }

  /**
   * Soft impact feedback (iOS only)
   * Use for: Gentle interactions
   */
  static soft(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('soft', hapticOptions);
    } else {
      // Fallback to light impact on Android
      HapticsManager.impactLight();
    }
  }

  /**
   * Clock tick feedback (iOS only)
   * Use for: Picker scrolling
   */
  static clockTick(): void {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('clockTick', hapticOptions);
    } else {
      // Fallback to selection on Android
      HapticsManager.selection();
    }
  }

  /**
   * Context click feedback (Android only)
   * Use for: Long press
   */
  static contextClick(): void {
    if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('contextClick', hapticOptions);
    } else {
      // Fallback to medium impact on iOS
      HapticsManager.impactMedium();
    }
  }

  /**
   * Keyboard press feedback (Android only)
   * Use for: Virtual keyboard
   */
  static keyboardPress(): void {
    if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('keyboardPress', hapticOptions);
    } else {
      // Fallback to selection on iOS
      HapticsManager.selection();
    }
  }

  /**
   * Virtual key feedback (Android only)
   * Use for: Navigation buttons
   */
  static virtualKey(): void {
    if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('virtualKey', hapticOptions);
    } else {
      // Fallback to selection on iOS
      HapticsManager.selection();
    }
  }

  /**
   * Keyboard tap feedback (Android only)
   * Use for: Keyboard interactions
   */
  static keyboardTap(): void {
    if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('keyboardTap', hapticOptions);
    } else {
      // Fallback to light impact on iOS
      HapticsManager.impactLight();
    }
  }

  /**
   * Long press feedback (Android only)
   * Use for: Long press actions
   */
  static longPress(): void {
    if (Platform.OS === 'android') {
      ReactNativeHapticFeedback.trigger('longPress', hapticOptions);
    } else {
      // Fallback to heavy impact on iOS
      HapticsManager.impactHeavy();
    }
  }
}

/**
 * Voice-specific haptic feedback
 * Custom haptic patterns for voice tutoring feature
 */
export class VoiceHaptics {
  /**
   * Start recording feedback
   */
  static startRecording(): void {
    HapticsManager.impactMedium();
  }

  /**
   * Stop recording feedback
   */
  static stopRecording(): void {
    HapticsManager.impactLight();
  }

  /**
   * Listening started feedback
   */
  static listeningStarted(): void {
    HapticsManager.soft();
  }

  /**
   * AI started speaking feedback
   */
  static aiSpeaking(): void {
    HapticsManager.selection();
  }

  /**
   * Turn change feedback (user <-> AI)
   */
  static turnChange(): void {
    HapticsManager.selection();
  }

  /**
   * Session started feedback
   */
  static sessionStarted(): void {
    HapticsManager.success();
  }

  /**
   * Session ended feedback
   */
  static sessionEnded(): void {
    HapticsManager.impactMedium();
  }

  /**
   * Error feedback
   */
  static error(): void {
    HapticsManager.error();
  }

  /**
   * Warning feedback (approaching limit)
   */
  static warning(): void {
    HapticsManager.warning();
  }

  /**
   * Limit reached feedback
   */
  static limitReached(): void {
    HapticsManager.error();
  }

  /**
   * Connected feedback
   */
  static connected(): void {
    HapticsManager.soft();
  }

  /**
   * Disconnected feedback
   */
  static disconnected(): void {
    HapticsManager.impactLight();
  }
}

export default HapticsManager;
