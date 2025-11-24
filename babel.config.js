module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // specific plugins can be added here if needed in the future
    ],
  };
};