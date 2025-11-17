/**
 * AsyncStorage Wrapper Service
 *
 * Provides typed, simplified access to AsyncStorage for persisting data.
 * Handles JSON serialization/deserialization automatically.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '@constants/config';
import type {AuthTokens, Student} from '@types/api';

/**
 * Generic storage operations
 */
class StorageService {
  /**
   * Save data to AsyncStorage with JSON serialization
   */
  async saveItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      throw error;
    }
  }

  /**
   * Get data from AsyncStorage with JSON deserialization
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Remove item from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple items at once
   */
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};

      pairs.forEach(([key, value]) => {
        if (value) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return {};
    }
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * Save JWT tokens
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await this.saveItem(STORAGE_KEYS.AUTH_TOKENS, tokens);
  }

  /**
   * Get JWT tokens
   */
  async getTokens(): Promise<AuthTokens | null> {
    return await this.getItem<AuthTokens>(STORAGE_KEYS.AUTH_TOKENS);
  }

  /**
   * Clear JWT tokens (logout)
   */
  async clearTokens(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.AUTH_TOKENS);
  }

  // ============================================================================
  // Student Data
  // ============================================================================

  /**
   * Save student profile data
   */
  async saveStudent(student: Student): Promise<void> {
    await this.saveItem(STORAGE_KEYS.USER_DATA, student);
  }

  /**
   * Get student profile data
   */
  async getStudent(): Promise<Student | null> {
    return await this.getItem<Student>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Clear student data
   */
  async clearStudent(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // ============================================================================
  // Offline Queue
  // ============================================================================

  /**
   * Save failed requests to offline queue
   */
  async saveOfflineQueue(queue: any[]): Promise<void> {
    await this.saveItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  }

  /**
   * Get offline queue
   */
  async getOfflineQueue(): Promise<any[]> {
    const queue = await this.getItem<any[]>(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue || [];
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  // ============================================================================
  // Cached Data
  // ============================================================================

  /**
   * Save cached lessons
   */
  async saveCachedLessons(lessons: any): Promise<void> {
    await this.saveItem(STORAGE_KEYS.CACHED_LESSONS, lessons);
  }

  /**
   * Get cached lessons
   */
  async getCachedLessons(): Promise<any | null> {
    return await this.getItem(STORAGE_KEYS.CACHED_LESSONS);
  }

  /**
   * Save cached progress
   */
  async saveCachedProgress(progress: any): Promise<void> {
    await this.saveItem(STORAGE_KEYS.CACHED_PROGRESS, progress);
  }

  /**
   * Get cached progress
   */
  async getCachedProgress(): Promise<any | null> {
    return await this.getItem(STORAGE_KEYS.CACHED_PROGRESS);
  }

  // ============================================================================
  // Generic Offline Data
  // ============================================================================

  /**
   * Save arbitrary offline data
   */
  async saveOfflineData(key: string, data: any): Promise<void> {
    await this.saveItem(`@somoai/offline_${key}`, data);
  }

  /**
   * Get arbitrary offline data
   */
  async getOfflineData(key: string): Promise<any | null> {
    return await this.getItem(`@somoai/offline_${key}`);
  }

  /**
   * Clear arbitrary offline data
   */
  async clearOfflineData(key: string): Promise<void> {
    await this.removeItem(`@somoai/offline_${key}`);
  }

  // ============================================================================
  // App Settings
  // ============================================================================

  /**
   * Save app settings
   */
  async saveAppSettings(settings: any): Promise<void> {
    await this.saveItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  /**
   * Get app settings
   */
  async getAppSettings(): Promise<any | null> {
    return await this.getItem(STORAGE_KEYS.APP_SETTINGS);
  }

  /**
   * Clear all app data (logout)
   */
  async clearAllAppData(): Promise<void> {
    try {
      await Promise.all([
        this.clearTokens(),
        this.clearStudent(),
        this.clearOfflineQueue(),
        this.removeItem(STORAGE_KEYS.CACHED_LESSONS),
        this.removeItem(STORAGE_KEYS.CACHED_PROGRESS),
      ]);
    } catch (error) {
      console.error('Error clearing app data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new StorageService();
