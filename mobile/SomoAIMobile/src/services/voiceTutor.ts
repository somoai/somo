/**
 * Voice Tutor Service - ElevenLabs Conversational AI Integration
 *
 * Provides real-time voice tutoring with:
 * - Natural voice conversations
 * - Kenyan English accent
 * - Code-switching (English/Swahili)
 * - Turn-taking management
 * - Session persistence
 * - Usage tracking
 */

import {AI_CONFIG} from '@constants/config';

/**
 * Voice session interface
 */
export interface VoiceSession {
  sessionId: string;
  agentId: string;
  studentId: string;
  startedAt: number;
  status: 'active' | 'paused' | 'ended';
  minutesUsed: number;
}

/**
 * Voice message interface
 */
export interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  duration?: number;
  timestamp: number;
}

/**
 * Student profile for voice tutor
 */
interface StudentProfile {
  id: string;
  name: string;
  grade?: number;
  language?: string;
}

/**
 * ElevenLabs conversation configuration
 */
interface ConversationConfig {
  voice: {
    voice_id: string;
    stability: number;
    similarity_boost: number;
    style: number;
  };
  model: string;
  language: string;
  conversation_config: {
    turn_detection: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
    agent: {
      prompt: {
        prompt: string;
        llm: string;
        temperature: number;
        max_tokens: number;
      };
      first_message: string;
    };
  };
}

/**
 * Voice Tutor Service Class
 */
class VoiceTutorService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private activeSessions: Map<string, VoiceSession>;

  constructor() {
    this.apiKey = AI_CONFIG.ELEVENLABS_API_KEY || '';
    this.activeSessions = new Map();
  }

  /**
   * Create voice tutor session
   */
  async createVoiceSession(
    student: StudentProfile,
    concept?: string,
  ): Promise<VoiceSession> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const config = this.buildConversationConfig(student, concept);

      const response = await fetch(`${this.baseUrl}/convai/conversation`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `ElevenLabs API error: ${response.status}`,
        );
      }

      const data = await response.json();

      const session: VoiceSession = {
        sessionId: data.conversation_id || `session-${Date.now()}`,
        agentId: data.agent_id || 'default-agent',
        studentId: student.id,
        startedAt: Date.now(),
        status: 'active',
        minutesUsed: 0,
      };

      this.activeSessions.set(session.sessionId, session);

      return session;
    } catch (error) {
      console.error('Failed to create voice session:', error);
      throw new Error('Could not start voice tutor. Please try again.');
    }
  }

  /**
   * Build conversation config with Kenyan context
   */
  private buildConversationConfig(
    student: StudentProfile,
    concept?: string,
  ): ConversationConfig {
    const grade = student.grade || 5;
    const studentName = student.name || 'friend';
    const language = student.language || 'en';

    const systemPrompt = `You are a friendly, encouraging Kenyan tutor speaking with ${studentName}, a Grade ${grade} student.

VOICE & STYLE:
- Speak naturally like a Kenyan teacher (warm, patient, enthusiastic)
- Use a conversational tone, not formal
- Code-switch naturally between English and Kiswahili when helpful
- Use Kenyan expressions: "Sawa?", "Vizuri!", "Hongera!", "Pole pole"
- Speak at a moderate pace (not too fast for young learners)
- Keep responses concise and clear

TEACHING APPROACH:
- Ask simple, guiding questions (Socratic method)
- Use Kenyan examples: matatus, chapati, ugali, M-Pesa, shillings
- Break down complex ideas into tiny steps
- Celebrate wins enthusiastically: "Vizuri sana!", "Perfect!"
- If student struggles, give gentler hints, never harsh criticism
- Never give direct answers - guide them to discover
- Relate concepts to everyday Kenyan life

CONVERSATION FLOW:
- Keep responses under 30 seconds
- Ask ONE question at a time
- Wait for student response before continuing
- Encourage: "You're doing great!", "Almost there!", "Karibu sana!"
- Use "we" language: "Let's try this together", "Tujaribu pamoja"
- Be patient with mistakes - they're learning opportunities

GRADE ${grade} APPROPRIATE:
- Use vocabulary suitable for Grade ${grade}
- Adjust complexity to their level
- Make examples age-appropriate
- Be encouraging, not condescending

${concept ? `CURRENT TOPIC: ${concept}\nHelp ${studentName} understand this concept through gentle questioning and Kenyan examples.` : ''}

Remember: You're a voice tutor, so speak naturally as if you're in the room with ${studentName}. Be their friendly learning companion!`;

    const greetingMessage =
      language === 'sw'
        ? `Habari ${studentName}! Mimi ni msaidizi wako wa kusoma. Ungependa tujifunze nini leo?`
        : `Hi ${studentName}! I'm here to help you learn. What would you like to work on today?`;

    return {
      voice: {
        voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam - warm, clear male voice
        stability: 0.5, // Balanced between consistent and expressive
        similarity_boost: 0.75, // High similarity to natural voice
        style: 0.5, // Moderate style exaggeration
      },
      model: 'eleven_turbo_v2', // Fast, low-latency model
      language: language === 'sw' ? 'sw' : 'en',
      conversation_config: {
        turn_detection: {
          type: 'server_vad', // Server-side voice activity detection
          threshold: 0.5, // Moderate sensitivity
          prefix_padding_ms: 300, // Keep 300ms before speech
          silence_duration_ms: 800, // 800ms silence before turn ends
        },
        agent: {
          prompt: {
            prompt: systemPrompt,
            llm: 'gpt-4', // Best quality for tutoring
            temperature: 0.7, // Creative but focused
            max_tokens: 150, // Keep responses concise
          },
          first_message: greetingMessage,
        },
      },
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<VoiceMessage[]> {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const response = await fetch(
        `${this.baseUrl}/convai/conversation/${sessionId}`,
        {
          headers: {
            'xi-api-key': this.apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.status}`);
      }

      const data = await response.json();

      return (data.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.message || msg.content,
        audioUrl: msg.audio_url,
        duration: msg.duration,
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
      }));
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * End voice session
   */
  async endSession(sessionId: string): Promise<number> {
    try {
      const session = this.activeSessions.get(sessionId);

      if (session) {
        // Calculate minutes used
        const durationMs = Date.now() - session.startedAt;
        const minutesUsed = Math.ceil(durationMs / 60000); // Round up to nearest minute

        session.status = 'ended';
        session.minutesUsed = minutesUsed;

        // End session with ElevenLabs if API key is configured
        if (this.apiKey) {
          await fetch(`${this.baseUrl}/convai/conversation/${sessionId}/end`, {
            method: 'POST',
            headers: {
              'xi-api-key': this.apiKey,
            },
          }).catch(err => console.error('Failed to end session with API:', err));
        }

        this.activeSessions.delete(sessionId);

        return minutesUsed;
      }

      return 0;
    } catch (error) {
      console.error('Failed to end session:', error);
      return 0;
    }
  }

  /**
   * Pause voice session
   */
  pauseSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
    }
  }

  /**
   * Resume voice session
   */
  resumeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'active';
    }
  }

  /**
   * Get active session for student
   */
  getActiveSession(studentId: string): VoiceSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.studentId === studentId && session.status === 'active') {
        return session;
      }
    }
    return null;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): VoiceSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Calculate cost for session
   */
  calculateCost(minutesUsed: number): number {
    const costPerMinute = AI_CONFIG.VOICE_TUTOR_COST_PER_MINUTE || 0.05;
    return minutesUsed * costPerMinute;
  }

  /**
   * Check if student has available minutes
   */
  hasAvailableMinutes(
    minutesUsed: number,
    tier: 'free' | 'premium' = 'free',
  ): boolean {
    const limit =
      tier === 'premium'
        ? AI_CONFIG.VOICE_TUTOR_PREMIUM_MINUTES_PER_DAY
        : AI_CONFIG.VOICE_TUTOR_FREE_MINUTES_PER_DAY;

    return minutesUsed < limit;
  }
}

export default new VoiceTutorService();
