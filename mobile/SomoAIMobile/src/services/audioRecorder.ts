/**
 * Audio Recorder Service
 *
 * Handles audio recording and playback for voice tutoring:
 * - Records audio in 16kHz mono PCM for ElevenLabs
 * - Streams audio chunks in real-time
 * - Plays back AI voice responses
 * - Manages recording state and permissions
 */

import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import {Platform, PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';

/**
 * Recording configuration for ElevenLabs compatibility
 */
interface RecordingConfig {
  sampleRate: number; // 16000 Hz required by ElevenLabs
  channels: number; // 1 for mono
  bitsPerSample: number; // 16-bit
  audioEncoder?: AudioEncoderAndroidType;
  audioSource?: AudioSourceAndroidType;
  avEncoderAudioQualityKeyIOS?: AVEncoderAudioQualityIOSType;
  avEncodingOption?: AVEncodingOption;
}

/**
 * Audio chunk callback type
 */
type AudioChunkCallback = (chunk: ArrayBuffer) => void;

/**
 * Playback progress callback type
 */
type PlaybackProgressCallback = (position: number, duration: number) => void;

/**
 * Audio Recorder Service Class
 */
class AudioRecorderService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private recordPath: string;
  private playPath: string;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private chunkCallback: AudioChunkCallback | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;
  private chunkSize: number = 4096; // Send 4KB chunks

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.1); // Update every 100ms

    // Set file paths
    const timestamp = Date.now();
    this.recordPath = Platform.select({
      ios: `voice_recording_${timestamp}.m4a`,
      android: `${RNFS.CachesDirectoryPath}/voice_recording_${timestamp}.m4a`,
    })!;

    this.playPath = Platform.select({
      ios: `voice_response_${timestamp}.m4a`,
      android: `${RNFS.CachesDirectoryPath}/voice_response_${timestamp}.m4a`,
    })!;
  }

  /**
   * Start recording audio with streaming chunks
   */
  async startRecording(onChunk: AudioChunkCallback): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      // Check permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (!granted) {
          throw new Error('Microphone permission not granted');
        }
      }

      this.chunkCallback = onChunk;

      // ElevenLabs-compatible recording configuration
      const audioSet: RecordingConfig = {
        sampleRate: 16000, // 16kHz required by ElevenLabs
        channels: 1, // Mono
        bitsPerSample: 16, // 16-bit PCM
      };

      // Platform-specific settings
      if (Platform.OS === 'android') {
        audioSet.audioEncoder = AudioEncoderAndroidType.AAC;
        audioSet.audioSource = AudioSourceAndroidType.MIC;
      } else {
        audioSet.avEncoderAudioQualityKeyIOS =
          AVEncoderAudioQualityIOSType.high;
        audioSet.avEncodingOption = AVEncodingOption.lpcm;
      }

      // Start recording
      await this.audioRecorderPlayer.startRecorder(this.recordPath, audioSet);
      this.isRecording = true;

      // Set up chunk streaming
      this.setupChunkStreaming();

      console.log('Recording started:', this.recordPath);
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      throw new Error('Could not start recording. Please try again.');
    }
  }

  /**
   * Set up periodic audio chunk streaming
   */
  private setupChunkStreaming(): void {
    // Stream chunks every 500ms for real-time processing
    this.recordingInterval = setInterval(async () => {
      if (!this.isRecording || !this.chunkCallback) {
        return;
      }

      try {
        // Read the current recording file
        const fileExists = await RNFS.exists(this.recordPath);
        if (!fileExists) {
          return;
        }

        // Read audio data as base64
        const audioBase64 = await RNFS.read(
          this.recordPath,
          -this.chunkSize,
          0,
          'base64',
        );

        if (audioBase64) {
          // Convert base64 to ArrayBuffer
          const arrayBuffer = this.base64ToArrayBuffer(audioBase64);
          this.chunkCallback(arrayBuffer);
        }
      } catch (error) {
        console.error('Error streaming audio chunk:', error);
      }
    }, 500); // Stream every 500ms
  }

  /**
   * Stop recording and return final audio
   */
  async stopRecording(): Promise<string> {
    try {
      if (!this.isRecording) {
        console.warn('Not recording');
        return '';
      }

      // Clear streaming interval
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }

      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecording = false;
      this.chunkCallback = null;

      console.log('Recording stopped:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      throw new Error('Could not stop recording.');
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording) {
        return;
      }

      await this.audioRecorderPlayer.pauseRecorder();

      // Clear streaming interval while paused
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }

      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw new Error('Could not pause recording.');
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording) {
        return;
      }

      await this.audioRecorderPlayer.resumeRecorder();

      // Resume chunk streaming
      this.setupChunkStreaming();

      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw new Error('Could not resume recording.');
    }
  }

  /**
   * Play audio response from file path
   */
  async playAudio(
    filePath: string,
    onProgress?: PlaybackProgressCallback,
  ): Promise<void> {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      this.isPlaying = true;

      // Set up progress listener
      if (onProgress) {
        this.audioRecorderPlayer.addPlayBackListener(e => {
          if (e.currentPosition && e.duration) {
            onProgress(e.currentPosition, e.duration);
          }

          // Auto-stop when finished
          if (e.currentPosition >= e.duration) {
            this.stopPlayback();
          }
        });
      }

      await this.audioRecorderPlayer.startPlayer(filePath);
      console.log('Playback started:', filePath);
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.isPlaying = false;
      throw new Error('Could not play audio.');
    }
  }

  /**
   * Play audio from ArrayBuffer (ElevenLabs response)
   */
  async playAudioBuffer(
    audioBuffer: ArrayBuffer,
    onProgress?: PlaybackProgressCallback,
  ): Promise<void> {
    try {
      // Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(audioBuffer);

      // Write to temporary file
      const tempPath = Platform.select({
        ios: `voice_response_${Date.now()}.m4a`,
        android: `${RNFS.CachesDirectoryPath}/voice_response_${Date.now()}.m4a`,
      })!;

      await RNFS.writeFile(tempPath, base64Audio, 'base64');

      // Play the file
      await this.playAudio(tempPath, onProgress);

      // Clean up file after playback
      setTimeout(async () => {
        try {
          await RNFS.unlink(tempPath);
        } catch (err) {
          console.error('Failed to delete temp audio file:', err);
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to play audio buffer:', error);
      throw new Error('Could not play audio response.');
    }
  }

  /**
   * Stop audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (!this.isPlaying) {
        return;
      }

      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();
      this.isPlaying = false;

      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw new Error('Could not stop playback.');
    }
  }

  /**
   * Pause audio playback
   */
  async pausePlayback(): Promise<void> {
    try {
      if (!this.isPlaying) {
        return;
      }

      await this.audioRecorderPlayer.pausePlayer();
      console.log('Playback paused');
    } catch (error) {
      console.error('Failed to pause playback:', error);
      throw new Error('Could not pause playback.');
    }
  }

  /**
   * Resume audio playback
   */
  async resumePlayback(): Promise<void> {
    try {
      if (!this.isPlaying) {
        return;
      }

      await this.audioRecorderPlayer.resumePlayer();
      console.log('Playback resumed');
    } catch (error) {
      console.error('Failed to resume playback:', error);
      throw new Error('Could not resume playback.');
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      // Stop recording if active
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Stop playback if active
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      // Clear interval
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }

      // Delete temporary files
      const files = [this.recordPath, this.playPath];
      for (const file of files) {
        try {
          const exists = await RNFS.exists(file);
          if (exists) {
            await RNFS.unlink(file);
          }
        } catch (err) {
          console.error('Failed to delete file:', file, err);
        }
      }

      console.log('Audio recorder cleaned up');
    } catch (error) {
      console.error('Failed to cleanup audio recorder:', error);
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * Get current playback status
   */
  getPlaybackStatus(): boolean {
    return this.isPlaying;
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

export default new AudioRecorderService();
