module.exports = function (api) {
  api.cache(true);

  // Bestimme welche .env Datei basierend auf APP_ENV geladen wird
  const envFile = process.env.APP_ENV === 'production' || process.env.APP_ENV === 'preview'
    ? '.env.production'
    : '.env';

  console.log('📁 Loading env file:', envFile);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin'
    ]
  };
};

