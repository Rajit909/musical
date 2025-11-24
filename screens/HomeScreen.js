import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, Dimensions, StatusBar } from 'react-native';
import SongCard from '../SongCard';
import { SONG_DATA } from '../data';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);

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
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={SONG_DATA}
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
