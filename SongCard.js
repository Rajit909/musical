import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  TouchableOpacity, 
  Animated, 
  Easing 
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

const SongCard = ({ item, isActive, isGlobalMuted, toggleGlobalMute, containerHeight }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Animation Value for rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Setup Rotation Animation
  useEffect(() => {
    let animation;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      rotateAnim.stopAnimation();
    }
    return () => animation && animation.stop();
  }, [isPlaying]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle Audio Playback
  useEffect(() => {
    let soundObject = null;
    let isCancelled = false;

    const loadSound = async () => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: item.audioUrl },
          { shouldPlay: isActive, isLooping: true, isMuted: isGlobalMuted },
          onPlaybackStatusUpdate
        );
        
        if (isCancelled) {
          await newSound.unloadAsync();
          return;
        }

        soundObject = newSound;
        setSound(newSound);
        if (isActive) setIsPlaying(true);
      } catch (error) {
        console.log('Error loading sound', error);
      }
    };

    const unloadSound = async () => {
      if (soundObject) {
        await soundObject.unloadAsync();
        soundObject = null;
        setSound(null);
        setIsPlaying(false);
      }
    };

    if (isActive) {
      loadSound();
    } else {
      unloadSound();
    }

    return () => {
      isCancelled = true;
      unloadSound();
    };
  }, [isActive, item.audioUrl]);

  // Handle Mute Toggling dynamically
  useEffect(() => {
    if (sound) {
      sound.setIsMutedAsync(isGlobalMuted);
    }
  }, [isGlobalMuted, sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      const duration = status.durationMillis || 1;
      const current = status.positionMillis || 0;
      setProgress(current / duration);
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  return (
    <View style={[styles.cardContainer, { height: containerHeight || WINDOW_HEIGHT }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={item.color}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Dark Overlay */}
      <View style={styles.overlay} />

      {/* Main Content */}
      <View style={styles.contentContainer}>
        
        {/* Rotating Disc */}
        <View style={styles.discContainer}>
          <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={item.color}
              style={styles.discInner}
            >
              <Feather name="disc" size={80} color="rgba(255,255,255,0.3)" />
              <View style={styles.discHole} />
              <View style={styles.discArtwork}>
                 <LinearGradient colors={item.color} style={{flex:1, opacity: 0.8}} />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Play Button Overlay (When Paused) */}
        {!isPlaying && isActive && (
          <TouchableOpacity 
            style={styles.centerPlayBtn} 
            onPress={togglePlay}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={50} color="white" style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        )}

      </View>

      {/* Right Side Actions */}
      <View style={styles.rightActionContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsLiked(!isLiked)}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? "#ef4444" : "white"} />
          <Text style={styles.actionText}>24.5k</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={30} color="white" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="more-horizontal" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.muteBtn]} onPress={toggleGlobalMute}>
          <Feather name={isGlobalMuted ? "volume-x" : "volume-2"} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Area */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomContainer}
      >
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>NEW RELEASE</Text>
          </View>
        </View>
        
        <Text style={styles.songTitle}>{item.title}</Text>
        
        <View style={styles.artistRow}>
          <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.artistName}>{item.artist}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100,
  },
  discContainer: {
    marginBottom: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  disc: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  discInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discHole: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#111',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#333',
  },
  discArtwork: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  centerPlayBtn: {
    position: 'absolute',
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rightActionContainer: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    alignItems: 'center',
  },
  actionBtn: {
    marginBottom: 20,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  },
  muteBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'flex-end',
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  songTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  artistName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
});

export default SongCard;