/**
 * Voice Chat Screen
 *
 * Real-time voice tutoring with ElevenLabs Conversational AI:
 * - Voice recording and streaming
 * - Real-time transcript display
 * - Session management
 * - Usage tracking with tier limits
 * - Beautiful animated voice visualizer
 * - Haptic feedback
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

// Services
import voiceTutorService from '@services/voiceTutor';
import audioRecorderService from '@services/audioRecorder';
import elevenLabsWebSocket, {
  TurnState,
  ConnectionStatus,
} from '@services/elevenLabsWebSocket';

// Utils
import {PermissionsManager} from '@utils/permissions';
import {VoiceHaptics} from '@utils/haptics';

// Components
import {VoiceVisualizer, VisualizerState} from '@components/voice/VoiceVisualizer';

// Redux
import {RootState} from '@store/index';
import {
  startVoiceSession,
  endVoiceSession,
  trackVoiceUsage,
  selectHasReachedVoiceLimit,
  selectRemainingMinutes,
  selectCurrentTier,
  VoiceTier,
} from '@store/slices/voiceSlice';

/**
 * Session state enum
 */
enum SessionState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  SPEAKING = 'speaking',
}

/**
 * Transcript message interface
 */
interface TranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

/**
 * Voice Chat Screen Component
 */
const VoiceChatScreen: React.FC = () => {
  const dispatch = useDispatch();

  // Redux state
  const student = useSelector((state: RootState) => state.student.profile);
  const currentSession = useSelector(
    (state: RootState) => state.voice.currentSession,
  );
  const dailyUsage = useSelector(
    (state: RootState) => state.voice.dailyUsage,
  );
  const hasReachedLimit = useSelector(selectHasReachedVoiceLimit);
  const remainingMinutes = useSelector(selectRemainingMinutes);
  const currentTier = useSelector(selectCurrentTier);

  // Local state
  const [sessionState, setSessionState] = useState<SessionState>(
    SessionState.IDLE,
  );
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentUserText, setCurrentUserText] = useState('');
  const [currentAssistantText, setCurrentAssistantText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED,
  );
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionStartTime = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check permissions on mount
   */
  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      handleEndSession();
    };
  }, []);

  /**
   * Auto-scroll transcript to bottom
   */
  useEffect(() => {
    if (transcript.length > 0) {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }
  }, [transcript]);

  /**
   * Check if limit is reached
   */
  useEffect(() => {
    if (hasReachedLimit && sessionState !== SessionState.IDLE) {
      handleLimitReached();
    }
  }, [hasReachedLimit]);

  /**
   * Check microphone permissions
   */
  const checkPermissions = async () => {
    const hasPermission = await PermissionsManager.hasMicrophonePermission();
    if (!hasPermission) {
      const granted =
        await PermissionsManager.requestMicrophoneWithRationale();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice tutoring.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Settings',
              onPress: () => PermissionsManager.showPermissionDeniedAlert(),
            },
          ],
        );
      }
    }
  };

  /**
   * Start voice session
   */
  const handleStartSession = async () => {
    try {
      // Check permissions first
      const hasPermission = await PermissionsManager.hasMicrophonePermission();
      if (!hasPermission) {
        PermissionsManager.showPermissionDeniedAlert();
        return;
      }

      // Check if limit reached
      if (hasReachedLimit) {
        showUpgradePrompt();
        return;
      }

      setSessionState(SessionState.CONNECTING);
      VoiceHaptics.sessionStarted();

      // Create voice session with ElevenLabs
      const session = await voiceTutorService.createVoiceSession({
        id: student?.id.toString() || '0',
        name: student?.first_name || 'Student',
        grade: student?.grade_level,
        language: student?.preferred_language,
      });

      // Start Redux session
      dispatch(startVoiceSession(session));

      // Connect WebSocket
      await elevenLabsWebSocket.connect(session.sessionId, session.agentId, {
        onConnected: handleWebSocketConnected,
        onDisconnected: handleWebSocketDisconnected,
        onAudioOutput: handleAudioOutput,
        onUserTranscript: handleUserTranscript,
        onAssistantTranscript: handleAssistantTranscript,
        onTurnChange: handleTurnChange,
        onError: handleWebSocketError,
      });

      // Start session timer
      sessionStartTime.current = Date.now();
      startSessionTimer();

      setConnectionStatus(ConnectionStatus.CONNECTED);
      setSessionState(SessionState.LISTENING);
    } catch (error) {
      console.error('Failed to start session:', error);
      VoiceHaptics.error();
      Alert.alert(
        'Connection Error',
        'Could not start voice tutor. Please try again.',
      );
      setSessionState(SessionState.IDLE);
    }
  };

  /**
   * End voice session
   */
  const handleEndSession = async () => {
    try {
      // Stop recording if active
      if (isRecording) {
        await audioRecorderService.stopRecording();
        setIsRecording(false);
      }

      // Disconnect WebSocket
      elevenLabsWebSocket.disconnect();

      // Stop session timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }

      // Calculate usage
      if (currentSession) {
        const minutesUsed = await voiceTutorService.endSession(
          currentSession.sessionId,
        );

        // Track usage in Redux
        dispatch(trackVoiceUsage(minutesUsed));
        dispatch(endVoiceSession());
      }

      // Cleanup audio
      await audioRecorderService.cleanup();

      // Reset state
      setSessionState(SessionState.IDLE);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      setElapsedMinutes(0);
      setTranscript([]);
      setCurrentUserText('');
      setCurrentAssistantText('');

      VoiceHaptics.sessionEnded();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  /**
   * Start recording audio
   */
  const handleStartRecording = async () => {
    try {
      if (sessionState !== SessionState.LISTENING) {
        return;
      }

      setIsRecording(true);
      VoiceHaptics.startRecording();

      // Start recording with chunk streaming
      await audioRecorderService.startRecording(chunk => {
        // Send audio chunk to WebSocket
        elevenLabsWebSocket.sendAudioChunk(chunk);
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      VoiceHaptics.error();
      setIsRecording(false);
    }
  };

  /**
   * Stop recording audio
   */
  const handleStopRecording = async () => {
    try {
      if (!isRecording) {
        return;
      }

      await audioRecorderService.stopRecording();
      setIsRecording(false);
      setSessionState(SessionState.PROCESSING);
      VoiceHaptics.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  /**
   * WebSocket connected
   */
  const handleWebSocketConnected = () => {
    console.log('WebSocket connected');
    VoiceHaptics.connected();
    setConnectionStatus(ConnectionStatus.CONNECTED);
  };

  /**
   * WebSocket disconnected
   */
  const handleWebSocketDisconnected = () => {
    console.log('WebSocket disconnected');
    VoiceHaptics.disconnected();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  };

  /**
   * Handle audio output from AI
   */
  const handleAudioOutput = async (audioBuffer: ArrayBuffer) => {
    try {
      // Play audio response
      await audioRecorderService.playAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  /**
   * Handle user transcript
   */
  const handleUserTranscript = (text: string, isFinal: boolean) => {
    setCurrentUserText(text);

    if (isFinal) {
      // Add to transcript
      setTranscript(prev => [
        ...prev,
        {
          role: 'user',
          text,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
      setCurrentUserText('');
    }
  };

  /**
   * Handle assistant transcript
   */
  const handleAssistantTranscript = (text: string, isFinal: boolean) => {
    setCurrentAssistantText(text);

    if (isFinal) {
      // Add to transcript
      setTranscript(prev => [
        ...prev,
        {
          role: 'assistant',
          text,
          timestamp: Date.now(),
          isFinal: true,
        },
      ]);
      setCurrentAssistantText('');
    }
  };

  /**
   * Handle turn change
   */
  const handleTurnChange = (turn: TurnState) => {
    VoiceHaptics.turnChange();

    switch (turn) {
      case TurnState.USER:
        setSessionState(SessionState.LISTENING);
        VoiceHaptics.listeningStarted();
        break;
      case TurnState.ASSISTANT:
        setSessionState(SessionState.SPEAKING);
        VoiceHaptics.aiSpeaking();
        break;
      case TurnState.IDLE:
        setSessionState(SessionState.IDLE);
        break;
    }
  };

  /**
   * Handle WebSocket error
   */
  const handleWebSocketError = (error: string) => {
    console.error('WebSocket error:', error);
    VoiceHaptics.error();
    Alert.alert('Connection Error', error);
  };

  /**
   * Handle limit reached
   */
  const handleLimitReached = () => {
    VoiceHaptics.limitReached();
    handleEndSession();
    showUpgradePrompt();
  };

  /**
   * Show upgrade prompt
   */
  const showUpgradePrompt = () => {
    const tierName = currentTier === VoiceTier.FREE ? 'Free' : 'Premium';
    const limit =
      currentTier === VoiceTier.FREE
        ? '5 minutes'
        : '60 minutes';

    Alert.alert(
      'Daily Limit Reached',
      `You've used your ${tierName} tier limit of ${limit} per day.\n\nUpgrade to Premium for 60 minutes of voice tutoring daily!`,
      [
        {text: 'Maybe Later', style: 'cancel'},
        {text: 'Upgrade to Premium', onPress: handleUpgrade},
      ],
    );
  };

  /**
   * Handle upgrade
   */
  const handleUpgrade = () => {
    Alert.alert('Coming Soon', 'Premium subscriptions will be available soon!');
  };

  /**
   * Start session timer
   */
  const startSessionTimer = () => {
    timerInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 60000);
      setElapsedMinutes(elapsed);

      // Check if approaching limit (1 minute warning)
      const limit = currentTier === VoiceTier.FREE ? 5 : 60;
      if (elapsed === limit - 1) {
        VoiceHaptics.warning();
        Alert.alert(
          'Time Warning',
          '1 minute remaining in your daily limit',
        );
      }
    }, 10000); // Check every 10 seconds
  };

  /**
   * Get visualizer state
   */
  const getVisualizerState = (): VisualizerState => {
    switch (sessionState) {
      case SessionState.LISTENING:
        return VisualizerState.LISTENING;
      case SessionState.SPEAKING:
        return VisualizerState.SPEAKING;
      default:
        return VisualizerState.IDLE;
    }
  };

  /**
   * Get session state text
   */
  const getStateText = (): string => {
    switch (sessionState) {
      case SessionState.IDLE:
        return 'Tap to start voice tutoring';
      case SessionState.CONNECTING:
        return 'Connecting to tutor...';
      case SessionState.LISTENING:
        return isRecording ? 'Listening...' : 'Hold to talk';
      case SessionState.PROCESSING:
        return 'Processing...';
      case SessionState.SPEAKING:
        return 'Tutor is speaking...';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Tutor</Text>
        <View style={styles.tierBadge}>
          <Icon
            name={currentTier === VoiceTier.PREMIUM ? 'star' : 'star-outline'}
            size={14}
            color={currentTier === VoiceTier.PREMIUM ? '#F59E0B' : '#64748B'}
          />
          <Text style={styles.tierText}>
            {currentTier === VoiceTier.FREE ? 'Free' : 'Premium'}
          </Text>
        </View>
      </View>

      {/* Usage Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Used Today</Text>
          <Text style={styles.statValue}>
            {dailyUsage?.minutesUsed || 0} min
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, remainingMinutes < 2 && styles.statWarning]}>
            {remainingMinutes} min
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Session</Text>
          <Text style={styles.statValue}>{elapsedMinutes} min</Text>
        </View>
      </View>

      {/* Transcript */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptContainer}
        contentContainerStyle={styles.transcriptContent}>
        {transcript.length === 0 && sessionState === SessionState.IDLE ? (
          <View style={styles.emptyState}>
            <Icon name="mic-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              Start a voice conversation with your AI tutor
            </Text>
            <Text style={styles.emptySubtext}>
              Ask questions, get homework help, or practice concepts
            </Text>
          </View>
        ) : (
          <>
            {transcript.map((message, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  message.role === 'user'
                    ? styles.userMessage
                    : styles.assistantMessage,
                ]}>
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? styles.userMessageText
                      : styles.assistantMessageText,
                  ]}>
                  {message.text}
                </Text>
              </View>
            ))}

            {/* Current user transcript (interim) */}
            {currentUserText && (
              <View style={[styles.messageContainer, styles.userMessage, styles.interimMessage]}>
                <Text style={[styles.messageText, styles.userMessageText]}>
                  {currentUserText}
                </Text>
              </View>
            )}

            {/* Current assistant transcript (interim) */}
            {currentAssistantText && (
              <View style={[styles.messageContainer, styles.assistantMessage, styles.interimMessage]}>
                <Text style={[styles.messageText, styles.assistantMessageText]}>
                  {currentAssistantText}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Visualizer */}
      <View style={styles.visualizerContainer}>
        <VoiceVisualizer
          state={getVisualizerState()}
          amplitude={isRecording ? 0.7 : 0.3}
          maxHeight={80}
        />
      </View>

      {/* State Text */}
      <Text style={styles.stateText}>{getStateText()}</Text>

      {/* Controls */}
      <View style={styles.controls}>
        {sessionState === SessionState.IDLE ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}
            disabled={hasReachedLimit}>
            <Icon name="mic" size={32} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            {/* Talk Button */}
            {sessionState === SessionState.LISTENING && (
              <TouchableOpacity
                style={[styles.talkButton, isRecording && styles.talkButtonActive]}
                onPressIn={handleStartRecording}
                onPressOut={handleStopRecording}>
                <Icon
                  name={isRecording ? 'mic' : 'mic-outline'}
                  size={48}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            {/* Processing Indicator */}
            {sessionState === SessionState.PROCESSING && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            )}

            {/* Speaking Indicator */}
            {sessionState === SessionState.SPEAKING && (
              <View style={styles.speakingContainer}>
                <Icon name="volume-high" size={48} color="#8B5CF6" />
              </View>
            )}

            {/* End Button */}
            <TouchableOpacity
              style={styles.endButton}
              onPress={handleEndSession}>
              <Icon name="stop-circle" size={24} color="#EF4444" />
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statWarning: {
    color: '#EF4444',
  },
  transcriptContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  transcriptContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  interimMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1E293B',
  },
  visualizerContainer: {
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stateText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeControls: {
    alignItems: 'center',
    gap: 16,
  },
  talkButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  talkButtonActive: {
    backgroundColor: '#059669',
    transform: [{scale: 1.1}],
  },
  processingContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default VoiceChatScreen;
