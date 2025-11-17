/**
 * Video Tutor Service
 *
 * Integrates with Tavus.io for real-time video conversations with AI teacher avatars:
 * - Photorealistic Kenyan teacher personas
 * - Real-time video streaming
 * - Natural gestures and expressions
 * - Visual teaching experience
 * - Premium feature (Ksh 299/month)
 */

import {AI_CONFIG} from '@constants/config';

/**
 * Kenyan teacher persona
 */
export interface TavusPersona {
  personaId: string;
  personaName: string;
  subject: 'MATH' | 'ENGLISH' | 'SCIENCE' | 'ALL';
  avatarUrl: string;
  gender: 'male' | 'female';
  description: string;
  greeting: string;
}

/**
 * Video session
 */
export interface VideoSession {
  sessionId: string;
  conversationId: string;
  personaId: string;
  studentId: string;
  startedAt: Date;
  status: 'initializing' | 'active' | 'paused' | 'ended';
  videoUrl?: string;
  streamUrl?: string;
}

/**
 * Video message
 */
export interface VideoMessage {
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  timestamp: Date;
}

/**
 * Student profile interface
 */
interface StudentProfile {
  id: string;
  name: string;
  grade?: number;
  language?: string;
  struggles?: string[];
}

/**
 * Video Tutor Service Class
 */
class VideoTutorService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';
  private activeSessions: Map<string, VideoSession>;
  private availablePersonas: TavusPersona[];

  constructor() {
    this.apiKey = AI_CONFIG.TAVUS_API_KEY || '';
    this.activeSessions = new Map();
    this.availablePersonas = this.initializePersonas();
  }

  /**
   * Initialize Kenyan teacher personas
   */
  private initializePersonas(): TavusPersona[] {
    return [
      {
        personaId: 'miss_wanjiru',
        personaName: 'Miss Wanjiru',
        subject: 'MATH',
        avatarUrl: 'https://tavus-assets.s3.amazonaws.com/wanjiru.jpg',
        gender: 'female',
        description:
          'Experienced Math teacher from Nairobi. Patient and encouraging.',
        greeting:
          "Habari! I'm Miss Wanjiru, and I'm here to make Math fun and easy for you!",
      },
      {
        personaId: 'mr_kipchoge',
        personaName: 'Mr. Kipchoge',
        subject: 'SCIENCE',
        avatarUrl: 'https://tavus-assets.s3.amazonaws.com/kipchoge.jpg',
        gender: 'male',
        description:
          'Science enthusiast from Eldoret. Makes Science come alive!',
        greeting:
          "Hello! I'm Mr. Kipchoge. Let's explore the wonderful world of Science together!",
      },
      {
        personaId: 'miss_amina',
        personaName: 'Miss Amina',
        subject: 'ENGLISH',
        avatarUrl: 'https://tavus-assets.s3.amazonaws.com/amina.jpg',
        gender: 'female',
        description:
          'English teacher from Mombasa. Loves stories and creative writing.',
        greeting: "Jambo! I'm Miss Amina. Let's improve your English together!",
      },
    ];
  }

  /**
   * Get available personas
   */
  getPersonas(subject?: string): TavusPersona[] {
    if (!subject) {
      return this.availablePersonas;
    }
    return this.availablePersonas.filter(
      p => p.subject === subject || p.subject === 'ALL',
    );
  }

  /**
   * Get persona by ID
   */
  getPersonaById(personaId: string): TavusPersona | undefined {
    return this.availablePersonas.find(p => p.personaId === personaId);
  }

  /**
   * Build system prompt with Kenyan context and visual teaching instructions
   */
  private buildSystemPrompt(
    persona: TavusPersona,
    student: StudentProfile,
    concept?: string,
  ): string {
    const grade = student.grade || 8;
    const struggles = student.struggles || [];

    return `You are ${persona.personaName}, a warm and experienced Kenyan teacher speaking with ${student.name}, a Grade ${grade} student.

VISUAL TEACHING (IMPORTANT):
- You're in a Kenyan classroom environment
- Use natural hand gestures to emphasize important points
- Show facial expressions: smile when encouraging, thoughtful look when explaining
- Point to imaginary objects or whiteboard when teaching concepts
- Use body language like a real teacher would
- Make eye contact by looking at the camera
- Nod when student is correct, shake head gently when guiding them to reconsider
- Use counting on fingers for steps
- Draw shapes in the air when explaining geometry or diagrams

TEACHING APPROACH:
- Socratic method: Ask guiding questions instead of giving direct answers
- Break down complex topics into simple, digestible steps
- Use Kenyan examples: matatus, market, shillings, M-Pesa, ugali, chapati, Nairobi traffic
- Code-switch naturally between English and Swahili when helpful
- Celebrate wins enthusiastically with gestures and expressions
- Be extremely patient with mistakes - they're learning opportunities
- Check understanding frequently: "Umeelewa?" (Do you understand?)

COMMUNICATION STYLE:
- Keep responses under 45 seconds for engagement
- Ask ONE clear question at a time and wait for response
- Use encouraging phrases: "Vizuri sana!", "Hongera!", "You're doing great!"
- Build confidence with positive reinforcement
- Use "we" language: "Let's try this together", "Tujaribu pamoja"
- Show genuine excitement when student discovers answers
- Use Kenyan educational context and examples from CBC curriculum

${concept ? `CURRENT TOPIC: ${concept}\nFocus on helping ${student.name} understand this concept deeply through visual demonstrations and guided discovery.` : ''}

${struggles.length ? `KNOWN STRUGGLES: ${struggles.join(', ')}\nBe extra patient with these areas. Use more visual aids and simpler examples.` : ''}

IMPORTANT REMINDERS:
- You are on VIDEO - students can see you! Use your expressions and gestures.
- Be their favorite teacher - warm, patient, encouraging, and genuinely excited about learning.
- Make learning feel like a conversation with a trusted mentor, not a lecture.
- Show, don't just tell. Use your hands, face, and body to teach.

Remember: You're not just explaining - you're SHOWING and GUIDING ${student.name} to discover answers themselves through visual learning!`;
  }

  /**
   * Create video session with Tavus
   */
  async createVideoSession(
    student: StudentProfile,
    personaId: string,
    concept?: string,
  ): Promise<VideoSession> {
    try {
      const persona = this.getPersonaById(personaId);
      if (!persona) {
        throw new Error('Persona not found');
      }

      if (!this.apiKey) {
        throw new Error('Tavus API key not configured');
      }

      const systemPrompt = this.buildSystemPrompt(persona, student, concept);

      // Create replica (avatar) if it doesn't exist
      const replicaId = await this.ensureReplica(persona);

      // Create conversational video
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replica_id: replicaId,
          persona_name: persona.personaName,
          conversational_context: systemPrompt,
          properties: {
            max_duration: 1800, // 30 minutes
            enable_recording: true,
            video_quality: 'hd',
            frame_rate: 30,
          },
          callback_url: `${AI_CONFIG.API_BASE_URL}/webhooks/tavus-callback`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Tavus API error: ${error.message || response.status}`,
        );
      }

      const data = await response.json();

      const session: VideoSession = {
        sessionId: `video_${Date.now()}`,
        conversationId: data.conversation_id,
        personaId,
        studentId: student.id,
        startedAt: new Date(),
        status: 'initializing',
        videoUrl: data.conversation_url,
        streamUrl: data.stream_url,
      };

      this.activeSessions.set(session.sessionId, session);

      // Simulate initialization delay (waiting for Tavus to initialize)
      setTimeout(() => {
        const activeSession = this.activeSessions.get(session.sessionId);
        if (activeSession) {
          activeSession.status = 'active';
        }
      }, 3000);

      console.log('Video session created:', session.sessionId);
      return session;
    } catch (error) {
      console.error('Failed to create video session:', error);
      throw new Error(
        'Could not start video tutor. Please check your internet connection and try again.',
      );
    }
  }

  /**
   * Ensure replica exists for persona
   */
  private async ensureReplica(persona: TavusPersona): Promise<string> {
    try {
      // Check if replica exists
      const response = await fetch(`${this.baseUrl}/replicas`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const existingReplica = data.replicas?.find(
          (r: any) => r.name === persona.personaId,
        );

        if (existingReplica) {
          return existingReplica.replica_id;
        }
      }

      // Create new replica
      const createResponse = await fetch(`${this.baseUrl}/replicas`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: persona.personaId,
          training_video_url: persona.avatarUrl,
        }),
      });

      if (!createResponse.ok) {
        // Fallback to mock replica ID
        return `replica_${persona.personaId}`;
      }

      const createData = await createResponse.json();
      return createData.replica_id;
    } catch (error) {
      console.error('Failed to ensure replica:', error);
      // Fallback to mock replica ID
      return `replica_${persona.personaId}`;
    }
  }

  /**
   * Send text message to video tutor
   */
  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<VideoMessage> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!this.apiKey) {
        throw new Error('Tavus API key not configured');
      }

      const response = await fetch(
        `${this.baseUrl}/conversations/${session.conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      return {
        role: 'assistant',
        content: data.response_text || data.text || 'Response received',
        videoUrl: data.video_url,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Could not send message. Please try again.');
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<VideoMessage[]> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return [];
      }

      if (!this.apiKey) {
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/conversations/${session.conversationId}/messages`,
        {
          headers: {
            'x-api-key': this.apiKey,
          },
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return (
        data.messages?.map((msg: any) => ({
          role: msg.role,
          content: msg.text,
          videoUrl: msg.video_url,
          timestamp: new Date(msg.timestamp),
        })) || []
      );
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  /**
   * Pause video session
   */
  async pauseSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      session.status = 'paused';
      console.log('Video session paused:', sessionId);
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  }

  /**
   * Resume video session
   */
  async resumeSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      session.status = 'active';
      console.log('Video session resumed:', sessionId);
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  }

  /**
   * End video session
   */
  async endSession(sessionId: string): Promise<number> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return 0;
      }

      if (this.apiKey) {
        await fetch(
          `${this.baseUrl}/conversations/${session.conversationId}/end`,
          {
            method: 'POST',
            headers: {
              'x-api-key': this.apiKey,
            },
          },
        );
      }

      // Calculate minutes used
      const endTime = new Date();
      const minutesUsed = Math.ceil(
        (endTime.getTime() - session.startedAt.getTime()) / 60000,
      );

      session.status = 'ended';
      this.activeSessions.delete(sessionId);

      console.log(
        'Video session ended:',
        sessionId,
        'Minutes used:',
        minutesUsed,
      );
      return minutesUsed;
    } catch (error) {
      console.error('Failed to end session:', error);
      return 0;
    }
  }

  /**
   * Get active session for student
   */
  getActiveSession(studentId: string): VideoSession | null {
    for (const session of this.activeSessions.values()) {
      if (
        session.studentId === studentId &&
        (session.status === 'active' || session.status === 'initializing')
      ) {
        return session;
      }
    }
    return null;
  }

  /**
   * Calculate session cost
   * Tavus pricing: approximately $2 per minute for real-time video
   */
  calculateCost(durationMinutes: number): number {
    const costPerMinute = AI_CONFIG.VIDEO_TUTOR_COST_PER_MINUTE || 2.0;
    return durationMinutes * costPerMinute;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
}

export default new VideoTutorService();
