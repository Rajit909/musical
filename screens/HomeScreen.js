import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, Dimensions, StatusBar } from 'react-native';
import SongCard from '../SongCard';
import { getUserTopTracks } from '../services/SpotifyService';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);

  React.useEffect(() => {
    const fetchMusic = async () => {
      try {
        const topTracksResponse = await getUserTopTracks();
        if (topTracksResponse && topTracksResponse.items) {
          const mappedSongs = topTracksResponse.items.map((track) => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            color: ['#1DB954', '#191414'], // Spotify Green to Black gradient
            spotifyUri: track.uri,
            lyrics: [] // We don't have lyrics from Spotify API directly
          }));
          setSongs(mappedSongs);
        }
      } catch (error) {
        console.error('Error fetching top tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMusic();
  }, []);

  // Viewability Config to determine which item is visible
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Item is considered visible if 80% is shown
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItemIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = ({ item, index }) => {
    return (
      <SongCard 
        item={item} 
        isActive={activeItemIndex === index}
        isGlobalMuted={isGlobalMuted}
        toggleGlobalMute={() => setIsGlobalMuted(prev => !prev)}
        containerHeight={WINDOW_HEIGHT - 79}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={songs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        snapToInterval={WINDOW_HEIGHT - 79} // Adjust for tab bar height (approx 49-80px depending on device)
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(data, index) => (
          { length: WINDOW_HEIGHT - 79, offset: (WINDOW_HEIGHT - 79) * index, index }
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
