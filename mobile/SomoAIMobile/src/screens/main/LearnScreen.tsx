/**
 * Learn Screen
 *
 * Browse and discover lessons by subject.
 * Features subject filtering and lesson list.
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getLessonSequence} from '../../store/slices/learningSlice';
import LessonCard from '../../components/learning/LessonCard';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

interface Subject {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const SUBJECTS: Subject[] = [
  {id: 'MATH', label: 'Math', emoji: '📐', color: Colors.primary},
  {id: 'ENGLISH', label: 'English', emoji: '📚', color: Colors.secondary},
  {id: 'SCIENCE', label: 'Science', emoji: '🔬', color: Colors.success},
  {id: 'KISWAHILI', label: 'Kiswahili', emoji: '🇰🇪', color: Colors.warning},
];

/**
 * Learn Screen Component
 */
const LearnScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {lessonSequence, loading} = useAppSelector(state => state.learning);

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      loadLessons(selectedSubject);
    }
  }, [selectedSubject]);

  /**
   * Load lessons for selected subject
   */
  const loadLessons = async (subject: string) => {
    try {
      await dispatch(
        getLessonSequence({subject, topicId: 'introduction'}),
      ).unwrap();
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    if (!selectedSubject) return;
    setRefreshing(true);
    await loadLessons(selectedSubject);
    setRefreshing(false);
  };

  /**
   * Handle lesson press
   */
  const handleLessonPress = (lessonId: string) => {
    console.log('Open lesson:', lessonId);
    // TODO: Navigate to lesson detail
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Lessons</Text>
        <Text style={styles.headerSubtitle}>
          Choose a subject to start learning
        </Text>
      </View>

      {/* Subject filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subjectFilter}
      >
        {SUBJECTS.map(subject => (
          <Pressable
            key={subject.id}
            onPress={() => setSelectedSubject(subject.id)}
            style={[
              styles.subjectChip,
              selectedSubject === subject.id && styles.subjectChipActive,
              {borderColor: subject.color},
            ]}
          >
            <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
            <Text
              style={[
                styles.subjectLabel,
                selectedSubject === subject.id && styles.subjectLabelActive,
              ]}
            >
              {subject.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lessons list */}
      {selectedSubject ? (
        <FlatList
          data={lessonSequence}
          renderItem={({item}) => (
            <LessonCard
              lesson={item}
              onPress={() => handleLessonPress(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lessonsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyText}>
                No lessons available yet
              </Text>
              <Text style={styles.emptySubtext}>
                Check back soon for new content!
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🎯</Text>
          <Text style={styles.placeholderText}>
            Select a subject above to browse lessons
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
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
  subjectFilter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectChipActive: {
    backgroundColor: Colors.primarySubtle,
  },
  subjectEmoji: {
    fontSize: 20,
  },
  subjectLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  subjectLabelActive: {
    color: Colors.primary,
  },
  lessonsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  placeholderText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
});

export default LearnScreen;
