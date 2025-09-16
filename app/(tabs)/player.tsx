import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Audio } from "expo-av";
import { songs } from "@/constants/songs";

const { height } = Dimensions.get("window");

export default function PlayerScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sound = useRef<Audio.Sound | null>(null);

  // Play selected song
  const playSong = async (index: number) => {
    if (sound.current) {
      await sound.current.stopAsync();
      await sound.current.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: songs[index].url },
      { shouldPlay: true }
    );
    sound.current = newSound;
  };

  // Handle swipe to new song
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null) {
        setCurrentIndex(index);
        playSong(index);
      }
    }
  }).current;

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  return (
    <FlatList
      data={songs}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <View style={styles.container}>
          <Image source={{ uri: item.artwork }} style={styles.artwork} />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.artist}>{item.artist}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              if (sound.current) {
                const status = await sound.current.getStatusAsync();
                if (status.isPlaying) {
                  await sound.current.pauseAsync();
                } else {
                  await sound.current.playAsync();
                }
              }
            }}
          >
            <Text style={styles.buttonText}>▶️ / ⏸</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  artwork: {
    width: "100%",
    height: "70%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  artist: {
    fontSize: 16,
    color: "#aaa",
  },
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#1DB954",
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
