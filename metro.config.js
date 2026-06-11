const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add 'mjs' to the list of source extensions for packages like Supabase
if (config.resolver) {
  config.resolver.sourceExts = config.resolver.sourceExts || [];
  if (!config.resolver.sourceExts.includes('mjs')) {
    config.resolver.sourceExts.push('mjs');
  }
  // Enable modern package.json exports resolution
  config.resolver.unstable_enablePackageExports = true;
}

module.exports = withNativeWind(config, { input: "./global.css" });
