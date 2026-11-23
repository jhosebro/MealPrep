const { getDefaultConfig } = require("expo/metro-config");

const path = require("path");

const config = getDefaultConfig(__dirname);
const DEMO = process.env.EXPO_PUBLIC_DEMO === "1" && process.env.NODE_ENV !== "production";
const SUPABASE = path.join(__dirname, "services/supabase.ts");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes("@opentelemetry") ||
    moduleName.includes("opentelemetry")
  ) {
    return { type: "empty" };
  }
  // El build ESM de zustand/middleware usa import.meta, que rompe el bundle web (no es un módulo ES): usar el CJS.
  if (moduleName === "zustand/middleware") {
    return { type: "sourceFile", filePath: require.resolve("zustand/middleware") };
  }
  const res = context.resolveRequest(context, moduleName, platform);
  // Modo demo local (solo dev): Supabase en memoria con sesión y datos semilla. Ver services/supabase.demo.ts.
  if (DEMO && res.type === "sourceFile" && res.filePath === SUPABASE) {
    return { type: "sourceFile", filePath: path.join(__dirname, "services/supabase.demo.ts") };
  }
  return res;
};

module.exports = config;
