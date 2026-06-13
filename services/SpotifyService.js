import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const TOKEN_KEY = '@spotify_access_token';

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('Error getting access token', e);
    return null;
  }
};

export const saveAccessToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Error saving access token', e);
  }
};

export const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Error clearing access token', e);
  }
};

const fetchWithToken = async (endpoint, options = {}) => {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${errorDetails}`);
  }

  return response.json();
};

export const getCurrentUserProfile = async () => {
  return fetchWithToken('/me');
};

export const getUserPlaylists = async () => {
  return fetchWithToken('/me/playlists');
};

export const searchSpotify = async (query, type = 'track,artist,album') => {
  return fetchWithToken(`/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
};

export const getUserTopTracks = async () => {
  // Fetch user's top tracks
  return fetchWithToken('/me/top/tracks?limit=10');
};
