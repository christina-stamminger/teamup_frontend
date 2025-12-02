module.exports = function(api) {
  api.cache(true);
  
  // Bestimme welche .env Datei basierend auf APP_ENV geladen wird
  const envFile = process.env.APP_ENV === 'production' 
    ? '.env.production' 
    : '.env';
  
  console.log('📁 Loading env file:', envFile);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: envFile,
          safe: false,
          allowUndefined: true,
          verbose: false
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};

  