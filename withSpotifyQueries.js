const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withSpotifyQueries(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest.queries) {
      androidManifest.queries = [];
    }

    const hasSpotifyQuery = androidManifest.queries.some(
      (query) => query.package && query.package.some((p) => p.$['android:name'] === 'com.spotify.music')
    );

    if (!hasSpotifyQuery) {
      androidManifest.queries.push({
        package: [{ $: { 'android:name': 'com.spotify.music' } }],
      });
    }

    return config;
  });
};
