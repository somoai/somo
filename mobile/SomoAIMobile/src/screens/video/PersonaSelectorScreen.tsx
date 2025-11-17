/**
 * Persona Selector Screen
 *
 * Allows users to choose a Kenyan teacher persona for video tutoring:
 * - Browse available teacher personas
 * - View teacher profiles and specializations
 * - Premium feature enforcement
 * - Beautiful UI with gradients and avatars
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import videoTutorService from '@services/videoTutor';
import {RootState} from '@store/index';
import {HapticsManager} from '@utils/haptics';

/**
 * Route params interface
 */
interface RouteParams {
  subject?: string;
  concept?: string;
}

/**
 * Persona Selector Screen Component
 */
const PersonaSelectorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;

  const {profile} = useSelector((state: RootState) => state.student);

  const subject = params?.subject;
  const concept = params?.concept;

  // Get personas (filtered by subject if provided)
  const personas = videoTutorService.getPersonas(subject);

  /**
   * Check if user has premium access
   */
  const checkPremiumAccess = (): boolean => {
    // For now, allow all users (remove this check in production)
    // In production, check subscription tier:
    // const subscription = profile?.subscription;
    // if (subscription?.tier !== 'premium' && subscription?.tier !== 'premium_plus') {
    //   showUpgradePrompt();
    //   return false;
    // }
    return true;
  };

  /**
   * Show upgrade prompt for free tier users
   */
  const showUpgradePrompt = (): void => {
    Alert.alert(
      '⭐ Premium Feature',
      'Video tutoring with Kenyan teachers is available for Premium subscribers only.\n\nUpgrade to Premium for:\n• Unlimited video sessions (60 min/day)\n• Personal AI teachers with real faces\n• Visual learning experience\n• Homework camera help\n• Priority support\n\nOnly Ksh 299/month or $2.99/month!',
      [
        {text: 'Maybe Later', style: 'cancel'},
        {
          text: 'Upgrade to Premium',
          onPress: () => {
            // Navigate to subscription screen (to be implemented)
            Alert.alert(
              'Coming Soon',
              'Premium subscriptions will be available soon!',
            );
          },
        },
      ],
    );
  };

  /**
   * Handle persona selection
   */
  const handleSelectPersona = (personaId: string): void => {
    if (!checkPremiumAccess()) {
      return;
    }

    HapticsManager.selection();

    // Navigate to video chat screen
    navigation.navigate('VideoChat' as never, {
      personaId,
      concept,
    } as never);
  };

  /**
   * Get subject emoji
   */
  const getSubjectEmoji = (subject: string): string => {
    switch (subject) {
      case 'MATH':
        return '📐';
      case 'SCIENCE':
        return '🔬';
      case 'ENGLISH':
        return '📚';
      default:
        return '🎓';
    }
  };

  /**
   * Get gender icon
   */
  const getGenderIcon = (gender: string): string => {
    return gender === 'female' ? 'face-woman' : 'face-man';
  };

  /**
   * Render persona card
   */
  const renderPersona = ({item}: any) => {
    const subjectEmoji = getSubjectEmoji(item.subject);
    const genderIcon = getGenderIcon(item.gender);

    return (
      <Pressable
        onPress={() => handleSelectPersona(item.personaId)}
        style={styles.personaCard}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.personaGradient}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name={genderIcon} size={64} color="#8B5CF6" />
            </View>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectEmoji}>{subjectEmoji}</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.personaInfo}>
            <Text style={styles.personaName}>{item.personaName}</Text>
            <Text style={styles.personaSubject}>{item.subject} Teacher</Text>
            <Text style={styles.personaDescription}>{item.description}</Text>

            {/* Greeting Preview */}
            <View style={styles.greetingContainer}>
              <Icon name="chat-outline" size={16} color="#64748B" />
              <Text style={styles.greeting} numberOfLines={2}>
                "{item.greeting}"
              </Text>
            </View>
          </View>

          {/* Select Button */}
          <View style={styles.selectButton}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.selectGradient}>
              <Text style={styles.selectText}>Start Video Session</Text>
              <Icon name="video" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Title */}
      <Text style={styles.title}>Choose Your Video Tutor</Text>
      <Text style={styles.subtitle}>
        Select a Kenyan teacher for your personalized video learning session
      </Text>

      {/* Premium Badge */}
      <View style={styles.premiumBadge}>
        <Icon name="star" size={16} color="#F59E0B" />
        <Text style={styles.premiumText}>Premium Feature</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>Video Tutor</Text>
        <View style={{width: 24}} />
      </View>

      {/* Personas List */}
      <FlatList
        data={personas}
        renderItem={renderPersona}
        keyExtractor={item => item.personaId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  personaCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  personaGradient: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  subjectBadge: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  subjectEmoji: {
    fontSize: 20,
  },
  personaInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  personaName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  personaSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  personaDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    maxWidth: '100%',
  },
  greeting: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PersonaSelectorScreen;
