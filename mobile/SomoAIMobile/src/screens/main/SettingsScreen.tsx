/**
 * Settings Screen
 *
 * User settings and preferences including:
 * - Profile information display
 * - App preferences (language, notifications)
 * - Subscription management
 * - Account actions (logout)
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {logout} from '../../store/slices/authSlice';
import type {MainTabParamList} from '../../navigation/types';
import Button from '../../components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<MainTabParamList, 'Settings'>;

/**
 * Settings Row Component
 * Generic row for settings items
 */
interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  rightElement,
  showChevron = false,
}) => (
  <Pressable
    style={({pressed}) => [styles.settingsRow, pressed && styles.rowPressed]}
    onPress={onPress}
    disabled={!onPress && !rightElement}
  >
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>

    <View style={styles.rowRight}>
      {rightElement ? (
        rightElement
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : null}
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </View>
  </Pressable>
);

/**
 * Settings Section Component
 * Groups related settings
 */
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

/**
 * Settings Screen Component
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const {profile} = useAppSelector(state => state.student);
  const {isAuthenticated} = useAppSelector(state => state.auth);

  // Local state for preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              // Navigation handled by RootNavigator
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  /**
   * Handle edit profile
   */
  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  /**
   * Handle change language
   */
  const handleChangeLanguage = () => {
    Alert.alert(
      'Change Language',
      'Choose your preferred language',
      [
        {text: 'English', onPress: () => console.log('English selected')},
        {text: 'Kiswahili', onPress: () => console.log('Kiswahili selected')},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  };

  /**
   * Handle subscription
   */
  const handleSubscription = () => {
    Alert.alert('Subscription', 'Subscription management coming soon!');
  };

  /**
   * Handle help & support
   */
  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at:\nsupport@somoai.com',
      [{text: 'OK'}],
    );
  };

  /**
   * Handle privacy policy
   */
  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be displayed here.');
  };

  /**
   * Handle terms of service
   */
  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'Terms of service will be displayed here.',
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Section */}
        <SettingsSection title="Profile">
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || 'Student'}</Text>
              <Text style={styles.profileDetail}>
                Grade {profile?.grade || 'N/A'} • {profile?.school || 'No school'}
              </Text>
            </View>
            <Pressable
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsRow
            icon="🌐"
            label="Language"
            value="English"
            onPress={handleChangeLanguage}
            showChevron
          />
          <SettingsRow
            icon="🔔"
            label="Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{false: Colors.border, true: Colors.primarySubtle}}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="🔊"
            label="Sound Effects"
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{false: Colors.border, true: Colors.primarySubtle}}
                thumbColor={soundEnabled ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <SettingsRow
            icon="📳"
            label="Haptic Feedback"
            rightElement={
              <Switch
                value={hapticEnabled}
                onValueChange={setHapticEnabled}
                trackColor={{false: Colors.border, true: Colors.primarySubtle}}
                thumbColor={hapticEnabled ? Colors.primary : Colors.textTertiary}
              />
            }
          />
        </SettingsSection>

        {/* Subscription Section */}
        <SettingsSection title="Subscription">
          <SettingsRow
            icon="⭐"
            label="Manage Subscription"
            value="Free Plan"
            onPress={handleSubscription}
            showChevron
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsRow
            icon="❓"
            label="Help & Support"
            onPress={handleHelpSupport}
            showChevron
          />
          <SettingsRow
            icon="📄"
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
            showChevron
          />
          <SettingsRow
            icon="📋"
            label="Terms of Service"
            onPress={handleTermsOfService}
            showChevron
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About">
          <SettingsRow icon="ℹ️" label="Version" value="1.0.0" />
        </SettingsSection>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            fullWidth
            size="large"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Kenyan students
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.semibold,
    color: Colors.backgroundPrimary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  profileDetail: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: {
    backgroundColor: Colors.primarySubtle,
    opacity: 0.7,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  rowIcon: {
    fontSize: 20,
  },
  rowLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textTertiary,
    fontWeight: Typography.weights.regular,
  },
  logoutContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
});

export default SettingsScreen;
