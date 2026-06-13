import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import ExpoSpotifyRemoteModule from '../modules/expo-spotify-remote/src/ExpoSpotifyRemoteModule';
import { SPOTIFY_CLIENT_ID, spotifyDiscovery, spotifyScopes } from '../utils/spotifyAuth';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType, makeRedirectUri, exchangeCodeAsync } from 'expo-auth-session';
import { saveAccessToken } from '../services/SpotifyService';

WebBrowser.maybeCompleteAuthSession();

export default function SpotifyLoginScreen({ onLoginSuccess }) {
  const [isConnecting, setIsConnecting] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'musical'
  });
  
  // Log this so we can easily add it to the Spotify Dashboard
  console.log("EXACT REDIRECT URI FOR SPOTIFY DASHBOARD:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: spotifyScopes,
      usePKCE: true,
      redirectUri,
    },
    spotifyDiscovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      
      exchangeCodeAsync(
        {
          clientId: SPOTIFY_CLIENT_ID,
          code,
          redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier,
          },
        },
        spotifyDiscovery
      ).then(tokenResponse => {
        saveAccessToken(tokenResponse.accessToken).then(() => {
          connectAppRemote();
        });
      }).catch(err => {
        setIsConnecting(false);
        Alert.alert('Token Exchange Error', err.message);
      });
    } else if (response?.type === 'error') {
      setIsConnecting(false);
      Alert.alert('Authentication Error', response.error || 'Failed to authenticate with Spotify.');
    } else if (response?.type === 'dismiss') {
      setIsConnecting(false);
    }
  }, [response]);

  const handleConnect = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Unsupported Platform', 'The Spotify App Remote SDK only works on Android devices or emulators. Please build the Android app using "npx expo run:android".');
      return;
    }

    setIsConnecting(true);
    promptAsync();
  };

  const connectAppRemote = async () => {
    try {
      // Use Client ID from .env
      const clientId = SPOTIFY_CLIENT_ID; 
      // Redirect URI must match the one in Spotify Dashboard
      const redirectUri = 'musical://spotify-login-callback'; 
      
      const result = await ExpoSpotifyRemoteModule.connect(clientId, redirectUri);
      console.log('Spotify Connected:', result);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Spotify Connection Error:', error);
      Alert.alert('Connection Failed', error.message || 'Make sure the Spotify app is installed and logged in.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Musical</Text>
        <Text style={styles.subtitle}>Connect to your Spotify app to play music natively.</Text>
        
        <TouchableOpacity 
          style={styles.button}
          disabled={isConnecting}
          onPress={handleConnect}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Connect Spotify App</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1DB954', // Spotify Green
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

