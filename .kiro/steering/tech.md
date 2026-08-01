# Tech Stack

## Framework & Runtime

- **React Native** via **Expo SDK 55** (bare workflow with `expo-dev-client`)
- **Expo Router v5** — file-based routing, typed routes enabled
- **React 19** with React Compiler enabled (`experiments.reactCompiler: true`)
- **TypeScript 5.9** — strict mode, path alias `@/*` maps to project root

## Backend & Data

- **Supabase** — Postgres database, auth, and RLS policies
  - Client initialized in `services/supabase.ts` using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`
  - All DB mutations go through the `services/` layer; never call `supabase` directly from components or stores
- **AsyncStorage** — used for session persistence only
- **expo-secure-store** — sensitive token storage

## State Management

- **Zustand v5** — one store per domain (`authStore`, `fridgeStore`, `recipesStore`, `budgetStore`)
- Stores follow the pattern: `{ data, loading, error, ...actions }`
- Stores call services; components call stores

## Navigation

- Expo Router file-based routing
- Route groups: `(auth)` (authenticated shell), `(tabs)` (bottom tabs), `(unauthenticated)` (login flow)
- Dynamic routes use `[id]` segments (e.g., `app/fridge/[id]/index.tsx`)

## Styling

- **React Native StyleSheet** — all styles defined with `StyleSheet.create()` at the bottom of each file
- Theme from `constants/theme.ts` (`Colors.light` / `Colors.dark`) accessed via `useColorScheme()` hook
- Dark/light mode fully supported; always use `colors.xxx` tokens, never hardcode color hex values
- Primary brand color: `#4CAF50`

## Key Libraries

| Library | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `zustand` | Global state |
| `@supabase/supabase-js` | Backend client |
| `react-native-reanimated` | Animations |
| `react-native-gesture-handler` | Gestures |
| `react-native-safe-area-context` | Safe area insets |
| `expo-haptics` | Haptic feedback |
| `expo-local-authentication` | Biometric auth |
| `@react-native-community/datetimepicker` | Date/time pickers |
| `react-native-currency-input` | Currency input fields |

## Environment Variables

Stored in `.env`. All public vars must be prefixed `EXPO_PUBLIC_` to be accessible in the app bundle.

## Common Commands

```bash
# Start dev server (choose simulator/device interactively)
npx expo start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Lint
npm run lint

# Install dependencies (runs fix-otel postinstall script automatically)
npm install
```

## Database Migrations

SQL migration files live in `migrations/`. Apply them manually via the Supabase dashboard or CLI. Files are numbered sequentially (e.g., `002_budget_tables.sql`, `003_rls_policies.sql`).
