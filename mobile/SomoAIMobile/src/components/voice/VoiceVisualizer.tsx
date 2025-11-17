/**
 * Voice Visualizer Component
 *
 * Animated voice activity visualization:
 * - 5 vertical bars that animate based on voice amplitude
 * - Different states: idle, listening, speaking
 * - Smooth animations with React Native Animated
 * - Beautiful gradient colors matching SomoAI design
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated} from 'react-native';

/**
 * Visualizer state
 */
export enum VisualizerState {
  IDLE = 'idle',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
}

/**
 * Component props
 */
interface VoiceVisualizerProps {
  state: VisualizerState;
  amplitude?: number; // 0 to 1
  barCount?: number; // Default: 5
  barWidth?: number; // Default: 8
  barSpacing?: number; // Default: 8
  maxHeight?: number; // Default: 100
  color?: string; // Default: gradient
}

/**
 * Voice Visualizer Component
 */
export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  state,
  amplitude = 0.5,
  barCount = 5,
  barWidth = 8,
  barSpacing = 8,
  maxHeight = 100,
  color,
}) => {
  // Create animated values for each bar
  const barAnimations = useRef(
    Array.from({length: barCount}, () => new Animated.Value(0.2)),
  ).current;

  // Idle animation (subtle breathing effect)
  const idleAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Listening animation (reactive to amplitude)
  const listeningAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Speaking animation (active wave effect)
  const speakingAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Stop all animations first
    stopAllAnimations();

    switch (state) {
      case VisualizerState.IDLE:
        startIdleAnimation();
        break;
      case VisualizerState.LISTENING:
        startListeningAnimation();
        break;
      case VisualizerState.SPEAKING:
        startSpeakingAnimation();
        break;
    }

    return () => {
      stopAllAnimations();
    };
  }, [state, amplitude]);

  /**
   * Stop all running animations
   */
  const stopAllAnimations = () => {
    idleAnimation.current?.stop();
    listeningAnimation.current?.stop();
    speakingAnimation.current?.stop();
  };

  /**
   * Idle animation - subtle breathing effect
   */
  const startIdleAnimation = () => {
    const animations = barAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.2 + index * 0.05, // Staggered heights
            duration: 1000 + index * 100,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.1,
            duration: 1000 + index * 100,
            useNativeDriver: false,
          }),
        ]),
      );
    });

    idleAnimation.current = Animated.parallel(animations);
    idleAnimation.current.start();
  };

  /**
   * Listening animation - reactive to amplitude
   */
  const startListeningAnimation = () => {
    const animations = barAnimations.map((anim, index) => {
      // Each bar reacts differently to create a wave effect
      const barAmplitude = amplitude * (0.5 + Math.random() * 0.5);
      const targetHeight = Math.max(0.2, Math.min(1, barAmplitude));

      return Animated.spring(anim, {
        toValue: targetHeight,
        friction: 5,
        tension: 40,
        useNativeDriver: false,
      });
    });

    listeningAnimation.current = Animated.parallel(animations);
    listeningAnimation.current.start();
  };

  /**
   * Speaking animation - active wave effect
   */
  const startSpeakingAnimation = () => {
    const animations = barAnimations.map((anim, index) => {
      // Create a wave pattern
      const phase = (index / barCount) * Math.PI * 2;

      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.3 + Math.sin(phase) * 0.4 + amplitude * 0.3,
            duration: 300 + index * 50,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.5 + Math.cos(phase) * 0.3 + amplitude * 0.2,
            duration: 300 + index * 50,
            useNativeDriver: false,
          }),
        ]),
      );
    });

    speakingAnimation.current = Animated.parallel(animations);
    speakingAnimation.current.start();
  };

  /**
   * Get bar color based on state
   */
  const getBarColor = (): string => {
    if (color) return color;

    switch (state) {
      case VisualizerState.IDLE:
        return '#94A3B8'; // Slate gray
      case VisualizerState.LISTENING:
        return '#10B981'; // Green (listening)
      case VisualizerState.SPEAKING:
        return '#8B5CF6'; // Purple (AI speaking)
      default:
        return '#94A3B8';
    }
  };

  const barColor = getBarColor();

  return (
    <View style={styles.container}>
      <View style={[styles.visualizer, {gap: barSpacing}]}>
        {barAnimations.map((anim, index) => {
          const animatedHeight = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [maxHeight * 0.2, maxHeight],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: animatedHeight,
                  backgroundColor: barColor,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 4,
  },
});
