/**
 * ElevenLabs WebSocket Client
 *
 * Manages real-time WebSocket connection with ElevenLabs Conversational AI:
 * - Establishes and maintains WebSocket connection
 * - Sends audio chunks for processing
 * - Receives AI voice responses and transcripts
 * - Handles turn-taking and conversation flow
 * - Manages connection state and errors
 */

import {AI_CONFIG} from '@constants/config';

/**
 * WebSocket message types from ElevenLabs
 */
export enum MessageType {
  // Client -> Server
  AUDIO_INPUT = 'audio_input',
  USER_TRANSCRIPT = 'user_transcript',
  CONTROL = 'control',

  // Server -> Client
  AUDIO_OUTPUT = 'audio_output',
  ASSISTANT_TRANSCRIPT = 'assistant_transcript',
  TURN_CHANGE = 'turn_change',
  CONVERSATION_INIT = 'conversation_initiation',
  ERROR = 'error',
}

/**
 * Turn state (who is speaking)
 */
export enum TurnState {
  USER = 'user',
  ASSISTANT = 'assistant',
  IDLE = 'idle',
}

/**
 * WebSocket connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Message interfaces
 */
interface AudioInputMessage {
  type: MessageType.AUDIO_INPUT;
  audio: string; // Base64 encoded audio
}

interface AudioOutputMessage {
  type: MessageType.AUDIO_OUTPUT;
  audio: string; // Base64 encoded audio
  duration_ms?: number;
}

interface TranscriptMessage {
  type: MessageType.USER_TRANSCRIPT | MessageType.ASSISTANT_TRANSCRIPT;
  text: string;
  is_final?: boolean;
}

interface TurnChangeMessage {
  type: MessageType.TURN_CHANGE;
  turn: TurnState;
}

interface ErrorMessage {
  type: MessageType.ERROR;
  message: string;
  code?: string;
}

/**
 * Event callbacks
 */
export interface WebSocketCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onAudioOutput?: (audioData: ArrayBuffer) => void;
  onUserTranscript?: (text: string, isFinal: boolean) => void;
  onAssistantTranscript?: (text: string, isFinal: boolean) => void;
  onTurnChange?: (turn: TurnState) => void;
  onError?: (error: string) => void;
}

/**
 * ElevenLabs WebSocket Client Class
 */
class ElevenLabsWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private agentId: string | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to ElevenLabs WebSocket
   */
  async connect(
    sessionId: string,
    agentId: string,
    callbacks: WebSocketCallbacks,
  ): Promise<void> {
    try {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.warn('WebSocket already connected');
        return;
      }

      this.sessionId = sessionId;
      this.agentId = agentId;
      this.callbacks = callbacks;
      this.status = ConnectionStatus.CONNECTING;

      // Build WebSocket URL
      const apiKey = AI_CONFIG.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error('ElevenLabs API key not configured');
      }

      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation/${sessionId}?api_key=${apiKey}`;

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl);

      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      console.log('Connecting to ElevenLabs WebSocket...');
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      console.error('Failed to connect to WebSocket:', error);
      this.callbacks.onError?.('Failed to connect to voice tutor');
      throw error;
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.status = ConnectionStatus.CONNECTED;
    this.reconnectAttempts = 0;

    // Start ping/pong to keep connection alive
    this.startPing();

    this.callbacks.onConnected?.();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: WebSocketMessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case MessageType.CONVERSATION_INIT:
          console.log('Conversation initialized:', message);
          break;

        case MessageType.AUDIO_OUTPUT:
          this.handleAudioOutput(message as AudioOutputMessage);
          break;

        case MessageType.USER_TRANSCRIPT:
          this.handleUserTranscript(message as TranscriptMessage);
          break;

        case MessageType.ASSISTANT_TRANSCRIPT:
          this.handleAssistantTranscript(message as TranscriptMessage);
          break;

        case MessageType.TURN_CHANGE:
          this.handleTurnChange(message as TurnChangeMessage);
          break;

        case MessageType.ERROR:
          this.handleErrorMessage(message as ErrorMessage);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle audio output from assistant
   */
  private handleAudioOutput(message: AudioOutputMessage): void {
    try {
      // Decode base64 audio to ArrayBuffer
      const audioBuffer = this.base64ToArrayBuffer(message.audio);
      this.callbacks.onAudioOutput?.(audioBuffer);
    } catch (error) {
      console.error('Error handling audio output:', error);
    }
  }

  /**
   * Handle user transcript (speech-to-text)
   */
  private handleUserTranscript(message: TranscriptMessage): void {
    const isFinal = message.is_final ?? false;
    this.callbacks.onUserTranscript?.(message.text, isFinal);
  }

  /**
   * Handle assistant transcript (what AI is saying)
   */
  private handleAssistantTranscript(message: TranscriptMessage): void {
    const isFinal = message.is_final ?? false;
    this.callbacks.onAssistantTranscript?.(message.text, isFinal);
  }

  /**
   * Handle turn change (user <-> assistant)
   */
  private handleTurnChange(message: TurnChangeMessage): void {
    console.log('Turn changed to:', message.turn);
    this.callbacks.onTurnChange?.(message.turn);
  }

  /**
   * Handle error message from server
   */
  private handleErrorMessage(message: ErrorMessage): void {
    console.error('WebSocket error message:', message);
    this.callbacks.onError?.(message.message || 'Unknown error');
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.status = ConnectionStatus.ERROR;
    this.callbacks.onError?.('Connection error');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: WebSocketCloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.status = ConnectionStatus.DISCONNECTED;
    this.stopPing();

    this.callbacks.onDisconnected?.();

    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

    console.log(
      `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
    );

    this.reconnectTimeout = setTimeout(() => {
      if (this.sessionId && this.agentId) {
        this.connect(this.sessionId, this.agentId, this.callbacks);
      }
    }, delay);
  }

  /**
   * Send audio chunk to ElevenLabs
   */
  sendAudioChunk(audioBuffer: ArrayBuffer): void {
    if (this.status !== ConnectionStatus.CONNECTED || !this.ws) {
      console.warn('Cannot send audio: WebSocket not connected');
      return;
    }

    try {
      // Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(audioBuffer);

      const message: AudioInputMessage = {
        type: MessageType.AUDIO_INPUT,
        audio: base64Audio,
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      this.callbacks.onError?.('Failed to send audio');
    }
  }

  /**
   * Send control message (pause, resume, etc.)
   */
  sendControl(action: 'pause' | 'resume' | 'interrupt'): void {
    if (this.status !== ConnectionStatus.CONNECTED || !this.ws) {
      console.warn('Cannot send control: WebSocket not connected');
      return;
    }

    try {
      const message = {
        type: MessageType.CONTROL,
        action,
      };

      this.ws.send(JSON.stringify(message));
      console.log('Sent control:', action);
    } catch (error) {
      console.error('Error sending control:', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    try {
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Stop ping
      this.stopPing();

      // Close WebSocket
      if (this.ws) {
        this.ws.close(1000, 'Normal closure');
        this.ws = null;
      }

      this.status = ConnectionStatus.DISCONNECTED;
      this.sessionId = null;
      this.agentId = null;
      this.callbacks = {};
      this.reconnectAttempts = 0;

      console.log('WebSocket disconnected');
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }

  /**
   * Start ping/pong to keep connection alive
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({type: 'ping'}));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default new ElevenLabsWebSocketClient();
