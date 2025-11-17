/**
 * Network Monitor Service
 *
 * Monitors network connectivity and connection quality.
 * Helps with offline-first functionality and adaptive UI.
 */

import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

export type ConnectionStatus = 'online' | 'offline';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  quality: ConnectionQuality;
}

class NetworkMonitor {
  private listeners: Array<(state: NetworkState) => void> = [];
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: null,
    quality: 'excellent',
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  private initialize(): void {
    // Subscribe to network state changes
    NetInfo.addEventListener(this.handleNetworkChange);

    // Get initial state
    NetInfo.fetch().then(this.handleNetworkChange);
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable ?? false;

    // Determine connection quality based on type and details
    let quality: ConnectionQuality = 'offline';

    if (isConnected && isInternetReachable) {
      if (state.type === 'wifi') {
        quality = 'excellent';
      } else if (state.type === 'cellular') {
        // Check cellular generation
        const cellularGeneration = (state.details as any)?.cellularGeneration;
        if (cellularGeneration === '4g' || cellularGeneration === '5g') {
          quality = 'excellent';
        } else if (cellularGeneration === '3g') {
          quality = 'good';
        } else {
          quality = 'poor';
        }
      } else {
        quality = 'good';
      }
    }

    const newState: NetworkState = {
      isConnected,
      isInternetReachable,
      type: state.type,
      quality,
    };

    this.currentState = newState;

    // Notify all listeners
    this.listeners.forEach(listener => listener(newState));
  };

  /**
   * Check current connectivity status
   *
   * @returns 'online' or 'offline'
   *
   * @example
   * const status = await NetworkMonitor.checkConnectivity();
   * if (status === 'offline') {
   *   Alert.alert('No internet connection');
   * }
   */
  async checkConnectivity(): Promise<ConnectionStatus> {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable
      ? 'online'
      : 'offline';
  }

  /**
   * Get current connection quality
   *
   * @returns Connection quality rating
   *
   * @example
   * const quality = await NetworkMonitor.getConnectionQuality();
   * if (quality === 'poor') {
   *   // Show low-res images, reduce API calls
   * }
   */
  async getConnectionQuality(): Promise<ConnectionQuality> {
    await NetInfo.fetch(); // Refresh state
    return this.currentState.quality;
  }

  /**
   * Get current network state
   *
   * @returns Complete network state
   */
  getCurrentState(): NetworkState {
    return this.currentState;
  }

  /**
   * Check if device is online
   *
   * @returns true if connected and internet reachable
   */
  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  /**
   * Subscribe to network state changes
   *
   * @param callback Function to call when network state changes
   * @returns Unsubscribe function
   *
   * @example
   * const unsubscribe = NetworkMonitor.onConnectivityChange((state) => {
   *   console.log('Network changed:', state.quality);
   * });
   *
   * // Later...
   * unsubscribe();
   */
  onConnectivityChange(
    callback: (state: NetworkState) => void,
  ): () => void {
    this.listeners.push(callback);

    // Call immediately with current state
    callback(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Wait for network connection
   *
   * @param timeout Maximum time to wait (milliseconds)
   * @returns Promise that resolves when online or rejects on timeout
   *
   * @example
   * try {
   *   await NetworkMonitor.waitForConnection(5000);
   *   // Now online, proceed with API call
   * } catch (error) {
   *   // Still offline after 5 seconds
   * }
   */
  async waitForConnection(timeout: number = 10000): Promise<void> {
    if (this.isOnline()) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Connection timeout'));
      }, timeout);

      const unsubscribe = this.onConnectivityChange(state => {
        if (state.isConnected && state.isInternetReachable) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Test actual internet connectivity by pinging API
   *
   * @param url URL to ping (default: Google DNS)
   * @returns true if reachable
   */
  async testInternetReachability(
    url: string = 'https://dns.google',
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export default new NetworkMonitor();
