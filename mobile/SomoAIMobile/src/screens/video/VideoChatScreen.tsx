/**
 * Video Chat Screen
 *
 * Real-time video tutoring session with Tavus.io AI teacher:
 * - WebView video player for photorealistic avatar
 * - Text messaging with AI tutor
 * - Live transcript display (last 3 messages)
 * - Session management (start, pause, end)
 * - Usage tracking (minutes, cost)
 * - Auto-end at 60 minutes
 * - Warning at 55 minutes
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import {RootState, AppDispatch} from '@store/index';
import {
  startVideoSession,
  endVideoSession,
  trackVideoUsage,
  selectRemainingVideoMinutes,
} from '@store/slices/videoSlice';
import videoTutorService from '@services/videoTutor';
import {HapticsManager} from '@utils/haptics';

/**
 * Message interface
 */
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Route params interface
 */
interface RouteParams {
  personaId: string;
  concept?: string;
}

/**
 * Video Chat Screen Component
 */
const VideoChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const params = route.params as RouteParams;

  const {profile} = useSelector((state: RootState) => state.student);
  const {activeSession, loading, error} = useSelector(
    (state: RootState) => state.video,
  );
  const remainingMinutes = useSelector(selectRemainingVideoMinutes);

  const {personaId, concept} = params;

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [sendingMessage, setSendingMessage] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const webViewRef = useRef<WebView>(null);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    if (profile && personaId) {
      initializeSession();
    }

    return () => {
      // Cleanup on unmount
      if (activeSession) {
        handleEndSession();
      }
    };
  }, []);

  /**
   * Update elapsed time
   */
  useEffect(() => {
    if (sessionStartTime && activeSession) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - sessionStartTime.getTime()) / 60000,
        );
        setElapsedMinutes(elapsed);

        // Warning at 55 minutes
        if (elapsed === 55) {
          HapticsManager.warning();
          Alert.alert(
            '⏰ 5 Minutes Remaining',
            'Your video session will end in 5 minutes.',
            [{text: 'OK'}],
          );
        }

        // Auto-end at 60 minutes
        if (elapsed >= 60) {
          handleEndSession();
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [sessionStartTime, activeSession]);

  /**
   * Initialize video session
   */
  const initializeSession = async () => {
    if (!profile || !personaId) {
      return;
    }

    try {
      const persona = videoTutorService.getPersonaById(personaId);
      if (!persona) {
        throw new Error('Persona not found');
      }

      // Start session via Redux
      await dispatch(
        startVideoSession({
          student: {
            id: profile.id?.toString() || '0',
            name: profile.first_name || 'Student',
            grade: profile.grade_level,
            language: profile.preferred_language,
          },
          personaId,
          concept,
        }),
      ).unwrap();

      setSessionStartTime(new Date());

      // Add greeting message
      setMessages([
        {
          role: 'assistant',
          content: persona.greeting,
        },
      ]);

      HapticsManager.success();
    } catch (err) {
      console.error('Failed to start video session:', err);
      Alert.alert(
        'Connection Error',
        'Could not start video tutor. Please check your internet connection.',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    }
  };

  /**
   * Send message to AI tutor
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeSession || sendingMessage) {
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message to transcript
    setMessages(prev => [...prev, {role: 'user', content: userMessage}]);
    setSendingMessage(true);

    try {
      // Send message to video tutor
      const response = await videoTutorService.sendMessage(
        activeSession.sessionId,
        userMessage,
      );

      // Add assistant response to transcript
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
        },
      ]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);

      HapticsManager.selection();
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Could not send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  /**
   * End video session
   */
  const handleEndSession = async () => {
    if (!activeSession || !sessionStartTime) {
      return;
    }

    const endTime = new Date();
    const minutesUsed = Math.ceil(
      (endTime.getTime() - sessionStartTime.getTime()) / 60000,
    );
    const cost = videoTutorService.calculateCost(minutesUsed);

    try {
      // End session via Redux
      await dispatch(
        endVideoSession({
          sessionId: activeSession.sessionId,
          minutesUsed,
        }),
      ).unwrap();

      // Track usage
      dispatch(trackVideoUsage(minutesUsed));

      // Show summary
      Alert.alert(
        '✅ Session Complete',
        `You used ${minutesUsed} minute${minutesUsed !== 1 ? 's' : ''} of video tutoring.\n\nEstimated cost: $${cost.toFixed(2)}\n\nRemaining today: ${remainingMinutes - minutesUsed} minutes`,
        [{text: 'OK', onPress: () => navigation.navigate('Home' as never)}],
      );

      HapticsManager.success();
    } catch (error) {
      console.error('Failed to end session:', error);
      navigation.navigate('Home' as never);
    }
  };

  /**
   * Confirm end session
   */
  const confirmEndSession = () => {
    Alert.alert(
      'End Video Session?',
      `You've used ${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''}. Are you sure you want to end this session?`,
      [
        {text: 'Continue', style: 'cancel'},
        {
          text: 'End Session',
          style: 'destructive',
          onPress: handleEndSession,
        },
      ],
    );
  };

  /**
   * Loading state
   */
  if (loading || !activeSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Preparing your video tutor...</Text>
        <Text style={styles.loadingSubtext}>Setting up the classroom 🎓</Text>
      </View>
    );
  }

  const persona = videoTutorService.getPersonaById(personaId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.headerAvatar}>
            <Icon
              name={persona?.gender === 'female' ? 'face-woman' : 'face-man'}
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>{persona?.personaName}</Text>
            <Text style={styles.headerSubtitle}>
              {elapsedMinutes} min • {remainingMinutes} min left
            </Text>
          </View>
        </View>

        <Pressable onPress={confirmEndSession} style={styles.endButton}>
          <Icon name="close-circle" size={32} color="#EF4444" />
        </Pressable>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {activeSession.videoUrl ? (
          <WebView
            ref={webViewRef}
            source={{uri: activeSession.videoUrl}}
            style={styles.video}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.videoPlaceholder}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.placeholderText}>Loading video...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Icon name="video-outline" size={64} color="#94A3B8" />
            <Text style={styles.placeholderText}>Loading video...</Text>
          </View>
        )}
      </View>

      {/* Transcript (last 3 messages) */}
      <View style={styles.transcriptContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.transcriptScroll}
          contentContainerStyle={styles.transcriptContent}>
          {messages.slice(-3).map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}>
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' && styles.userMessageText,
                ]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {sendingMessage && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.typingText}>
                {persona?.personaName} is responding...
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your question or response..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
          multiline
          maxLength={500}
          editable={!sendingMessage}
        />

        <Pressable
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sendingMessage}
          style={[
            styles.sendButton,
            (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled,
          ]}>
          <LinearGradient
            colors={
              inputText.trim() && !sendingMessage
                ? ['#8B5CF6', '#7C3AED']
                : ['#94A3B8', '#94A3B8']
            }
            style={styles.sendGradient}>
            <Icon name="send" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  endButton: {
    padding: 4,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 12,
  },
  transcriptContainer: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
  },
  messageText: {
    fontSize: 14,
    color: '#1E293B',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E293B',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoChatScreen;
