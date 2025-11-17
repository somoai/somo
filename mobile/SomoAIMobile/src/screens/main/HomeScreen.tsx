/**
 * Home Screen
 *
 * Main dashboard screen showing personalized learning dashboard with:
 * - User greeting and avatar
 * - Streak and points stats
 * - Next recommended lesson
 * - Progress overview by subject
 * - Daily goal tracker
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getNextLesson, fetchProgress} from '../../store/slices/learningSlice';
import type {MainTabParamList} from '../../navigation/types';
import Button from '../../components/ui/Button';
import LessonCard from '../../components/learning/LessonCard';
import ProgressRing from '../../components/ui/ProgressRing';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<MainTabParamList, 'Home'>;

/**
 * Progress Card Component
 * Shows subject progress with circular ring
 */
interface ProgressCardProps {
  subject: string;
  progress: number;
  color: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  subject,
  progress,
  color,
}) => (
  <View style={styles.progressCard}>
    <ProgressRing progress={progress} size={60} strokeWidth={6} color={color} />
    <Text style={styles.progressSubject}>{subject}</Text>
    <Text style={styles.progressValue}>{progress}%</Text>
  </View>
);

/**
 * Home Screen Component
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const {profile} = useAppSelector(state => state.student);
  const {nextLesson, progress, loading} = useAppSelector(
    state => state.learning,
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Load dashboard data from API
   */
  const loadDashboardData = async () => {
    await Promise.all([
      dispatch(getNextLesson()).unwrap().catch(() => {}),
      dispatch(fetchProgress()).unwrap().catch(() => {}),
    ]);
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  /**
   * Navigate to lesson detail
   */
  const handleStartLesson = () => {
    if (nextLesson) {
      // TODO: Navigate to lesson detail screen
      console.log('Start lesson:', nextLesson.lesson.id);
    }
  };

  // Calculate daily goal progress
  const lessonsToday = progress?.lessons_completed_today || 0;
  const dailyGoal = 5;
  const goalProgress = Math.min((lessonsToday / dailyGoal) * 100, 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hi {profile?.name || 'there'}! 👋
            </Text>
            <Text style={styles.subGreeting}>Ready to learn today?</Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.avatarButton}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Streak & Points */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              🔥 {progress?.current_streak || 0}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ⭐ {progress?.total_points || 0}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {/* Next Lesson Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Your Next Lesson</Text>

          {nextLesson ? (
            <LessonCard
              lesson={nextLesson.lesson}
              difficulty={nextLesson.recommended_difficulty}
              estimatedTime={nextLesson.estimated_time}
              onPress={handleStartLesson}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Great job! You're all caught up.
              </Text>
              <Button
                title="Browse More Lessons"
                onPress={() => navigation.navigate('Learn')}
                variant="outline"
              />
            </View>
          )}
        </View>

        {/* Progress Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Your Progress</Text>

          <View style={styles.progressGrid}>
            <ProgressCard
              subject="Math"
              progress={
                progress?.subject_progress?.MATH ||
                progress?.subject_progress?.math ||
                0
              }
              color={Colors.primary}
            />
            <ProgressCard
              subject="English"
              progress={
                progress?.subject_progress?.ENGLISH ||
                progress?.subject_progress?.english ||
                0
              }
              color={Colors.secondary}
            />
            <ProgressCard
              subject="Science"
              progress={
                progress?.subject_progress?.SCIENCE ||
                progress?.subject_progress?.science ||
                0
              }
              color={Colors.success}
            />
          </View>
        </View>

        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Daily Goal</Text>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalText}>
                {lessonsToday} / {dailyGoal} lessons
              </Text>
              <Text style={styles.goalPercentage}>
                {Math.round(goalProgress)}%
              </Text>
            </View>

            <View style={styles.goalBar}>
              <View
                style={[styles.goalFill, {width: `${goalProgress}%`}]}
              />
            </View>

            <Text style={styles.goalSubtext}>
              {lessonsToday >= dailyGoal
                ? "Amazing! You've hit your daily goal! 🎉"
                : `${dailyGoal - lessonsToday} more to reach your goal!`}
            </Text>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  avatarButton: {
    // Button styling
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.backgroundPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  progressCard: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  progressSubject: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  progressValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  goalCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  goalText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  goalPercentage: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  goalBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  goalFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  goalSubtext: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
