import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@local_music_library';

export default function LibraryScreen({ navigation }) {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [localSongs, setLocalSongs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkPermissions();
    loadSavedLibrary();
  }, []);

  const checkPermissions = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      scanLocalMusic();
    }
  };

  const loadSavedLibrary = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLocalSongs(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading library:', error);
    }
  };

  const saveLibrary = async (songs) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch (error) {
      console.error('Error saving library:', error);
    }
  };

  const scanLocalMusic = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant media library access to scan your music.',
        [{ text: 'Grant Permission', onPress: requestPermissions }]
      );
      return;
    }

    setIsScanning(true);
    try {
      // Get audio files from media library
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000, // Limit to first 1000 songs
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const songs = await Promise.all(
        media.assets.map(async (asset, index) => {
          // Get asset info for metadata
          const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
          
          return {
            id: `local_${asset.id}`,
            title: asset.filename.replace(/\.[^/.]+$/, ''), // Remove extension
            artist: assetInfo.localUri ? 'Local Music' : 'Unknown Artist',
            audioUrl: assetInfo.localUri || assetInfo.uri,
            duration: asset.duration,
            isLocal: true,
            color: getRandomGradient(index),
            lyrics: [], // Can be added manually later
          };
        })
      );

      setLocalSongs(songs);
      await saveLibrary(songs);
      
      Alert.alert(
        'Scan Complete',
        `Found ${songs.length} songs in your library!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error scanning music:', error);
      Alert.alert('Error', 'Failed to scan music library. Please try again.');
    } finally {
      setIsScanning(false);
      setIsRefreshing(false);
    }
  };

  const getRandomGradient = (index) => {
    const gradients = [
      ['#6B21A8', '#1E3A8A'], // Purple to Blue
      ['#FACC15', '#EA580C'], // Yellow to Orange
      ['#06B6D4', '#C026D3'], // Cyan to Fuchsia
      ['#15803D', '#064E3B'], // Green to Emerald
      ['#DC2626', '#7C2D12'], // Red to Brown
      ['#4F46E5', '#7C3AED'], // Indigo to Purple
    ];
    return gradients[index % gradients.length];
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    scanLocalMusic();
  };

  const renderSongItem = ({ item }) => (
    <TouchableOpacity style={styles.songItem}>
      <LinearGradient
        colors={item.color}
        style={styles.songThumbnail}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="musical-note" size={24} color="white" />
      </LinearGradient>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <Ionicons name="play-circle-outline" size={32} color="white" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="musical-notes-outline" size={80} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTitle}>No Music Found</Text>
      <Text style={styles.emptySubtitle}>
        {permissionStatus === 'granted'
          ? 'Tap the button below to scan your device for music'
          : 'Grant permission to access your music library'}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f0f1e']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerSubtitle}>
          {localSongs.length} {localSongs.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>

      <FlatList
        data={localSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="white"
          />
        }
      />

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={permissionStatus === 'granted' ? scanLocalMusic : requestPermissions}
          disabled={isScanning}
        >
          <LinearGradient
            colors={['#6B21A8', '#1E3A8A']}
            style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isScanning ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="scan" size={24} color="white" />
                <Text style={styles.scanButtonText}>
                  {permissionStatus === 'granted' ? 'Scan Music Library' : 'Grant Permission'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  songThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 100, // Account for tab bar
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
