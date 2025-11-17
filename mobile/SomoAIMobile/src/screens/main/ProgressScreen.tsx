/**
 * Progress Screen
 *
 * Displays comprehensive learning progress including:
 * - Overall statistics (lessons, points, streak)
 * - Subject-specific progress with visual indicators
 * - Achievement badges and milestones
 * - Recent activity history
 * - Weekly goals and performance
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
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {fetchProgress} from '../../store/slices/learningSlice';
import ProgressRing from '../../components/ui/ProgressRing';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

/**
 * Stat Card Component
 * Displays individual statistic with icon
 */
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({icon, label, value, color}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statIcon, {color}]}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Subject Progress Bar Component
 * Horizontal progress bar with subject info
 */
interface SubjectProgressBarProps {
  subject: string;
  emoji: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  color: string;
}

const SubjectProgressBar: React.FC<SubjectProgressBarProps> = ({
  subject,
  emoji,
  progress,
  lessonsCompleted,
  totalLessons,
  color,
}) => (
  <View style={styles.subjectBar}>
    <View style={styles.subjectHeader}>
      <View style={styles.subjectInfo}>
        <Text style={styles.subjectEmoji}>{emoji}</Text>
        <Text style={styles.subjectName}>{subject}</Text>
      </View>
      <Text style={styles.subjectStats}>
        {lessonsCompleted}/{totalLessons} lessons
      </Text>
    </View>

    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, {width: `${progress}%`, backgroundColor: color}]} />
      </View>
      <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
    </View>
  </View>
);

/**
 * Achievement Badge Component
 * Displays unlocked or locked achievement
 */
interface AchievementBadgeProps {
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  emoji,
  title,
  description,
  unlocked,
}) => (
  <View style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}>
    <Text style={[styles.achievementEmoji, !unlocked && styles.lockedEmoji]}>
      {emoji}
    </Text>
    <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]}>
      {title}
    </Text>
    <Text style={[styles.achievementDesc, !unlocked && styles.lockedText]}>
      {description}
    </Text>
  </View>
);

/**
 * Progress Screen Component
 */
const ProgressScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {progress, loading} = useAppSelector(state => state.learning);
  const {profile} = useAppSelector(state => state.student);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgressData();
  }, []);

  /**
   * Load progress data from API
   */
  const loadProgressData = async () => {
    try {
      await dispatch(fetchProgress()).unwrap();
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  // Extract progress data with fallbacks
  const totalPoints = progress?.total_points || 0;
  const currentStreak = progress?.current_streak || 0;
  const lessonsCompleted = progress?.lessons_completed_today || 0;
  const totalLessons = progress?.total_lessons_completed || 0;

  // Subject progress data
  const subjects = [
    {
      id: 'MATH',
      name: 'Mathematics',
      emoji: '📐',
      progress: progress?.subject_progress?.MATH || progress?.subject_progress?.math || 0,
      lessonsCompleted: 12,
      totalLessons: 50,
      color: Colors.primary,
    },
    {
      id: 'ENGLISH',
      name: 'English',
      emoji: '📚',
      progress: progress?.subject_progress?.ENGLISH || progress?.subject_progress?.english || 0,
      lessonsCompleted: 8,
      totalLessons: 40,
      color: Colors.secondary,
    },
    {
      id: 'SCIENCE',
      name: 'Science',
      emoji: '🔬',
      progress: progress?.subject_progress?.SCIENCE || progress?.subject_progress?.science || 0,
      lessonsCompleted: 5,
      totalLessons: 30,
      color: Colors.success,
    },
    {
      id: 'KISWAHILI',
      name: 'Kiswahili',
      emoji: '🇰🇪',
      progress: progress?.subject_progress?.KISWAHILI || progress?.subject_progress?.kiswahili || 0,
      lessonsCompleted: 3,
      totalLessons: 25,
      color: Colors.warning,
    },
  ];

  // Achievement data (static for now, would come from API)
  const achievements = [
    {
      emoji: '🔥',
      title: '7-Day Streak',
      description: 'Learn 7 days in a row',
      unlocked: currentStreak >= 7,
    },
    {
      emoji: '⭐',
      title: 'First 100 Points',
      description: 'Earn 100 total points',
      unlocked: totalPoints >= 100,
    },
    {
      emoji: '🎯',
      title: 'Goal Crusher',
      description: 'Hit daily goal 5 times',
      unlocked: false,
    },
    {
      emoji: '🏆',
      title: 'Math Master',
      description: 'Complete 20 math lessons',
      unlocked: false,
    },
    {
      emoji: '📖',
      title: 'Bookworm',
      description: 'Complete 15 English lessons',
      unlocked: false,
    },
    {
      emoji: '🚀',
      title: 'Rising Star',
      description: 'Reach 500 total points',
      unlocked: false,
    },
  ];

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
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>
            Keep up the great work, {profile?.name || 'learner'}!
          </Text>
        </View>

        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overall Statistics</Text>

          <View style={styles.statsGrid}>
            <StatCard
              icon="🔥"
              label="Day Streak"
              value={currentStreak}
              color={Colors.error}
            />
            <StatCard
              icon="⭐"
              label="Total Points"
              value={totalPoints}
              color={Colors.warning}
            />
            <StatCard
              icon="📚"
              label="Lessons Done"
              value={totalLessons}
              color={Colors.primary}
            />
            <StatCard
              icon="🎯"
              label="Today"
              value={lessonsCompleted}
              color={Colors.success}
            />
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Subject Progress</Text>

          <View style={styles.subjectList}>
            {subjects.map(subject => (
              <SubjectProgressBar
                key={subject.id}
                subject={subject.name}
                emoji={subject.emoji}
                progress={subject.progress}
                lessonsCompleted={subject.lessonsCompleted}
                totalLessons={subject.totalLessons}
                color={subject.color}
              />
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                emoji={achievement.emoji}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
              />
            ))}
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 This Week</Text>

          <View style={styles.weeklyCard}>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Lessons Completed</Text>
              <Text style={styles.weeklyValue}>{totalLessons} lessons</Text>
            </View>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Points Earned</Text>
              <Text style={styles.weeklyValue}>{totalPoints} points</Text>
            </View>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Active Days</Text>
              <Text style={styles.weeklyValue}>{Math.min(currentStreak, 7)}/7 days</Text>
            </View>

            <View style={styles.weeklyFooter}>
              <Text style={styles.weeklyFooterText}>
                {currentStreak >= 7
                  ? "Amazing! You've been active every day this week! 🎉"
                  : 'Keep going! Try to be active every day this week.'}
              </Text>
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  subjectList: {
    gap: Spacing.md,
  },
  subjectBar: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectEmoji: {
    fontSize: 24,
  },
  subjectName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  subjectStats: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  progressPercentage: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievementBadge: {
    width: '31%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  achievementLocked: {
    borderColor: Colors.border,
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xxs,
  },
  achievementDesc: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  lockedText: {
    opacity: 0.7,
  },
  weeklyCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weeklyLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  weeklyValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  weeklyFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  weeklyFooterText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProgressScreen;
