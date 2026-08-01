# Project Structure

```
MealPrep/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout — SafeAreaProvider, StatusBar
│   ├── index.tsx               # Entry redirect (auth guard)
│   ├── (auth)/                 # Authenticated route group
│   │   └── _layout.tsx
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── _layout.tsx         # Tab bar config
│   │   ├── home.tsx
│   │   ├── fridge.tsx
│   │   ├── recipes.tsx
│   │   └── shopping.tsx
│   ├── (unauthenticated)/      # Login / sign-up screens
│   │   └── login.tsx
│   ├── fridge/
│   │   ├── add.tsx             # Add fridge item
│   │   └── [id]/index.tsx      # Item detail / edit
│   └── recipes/
│       └── detail.tsx
│
├── components/                 # Shared UI components
│   ├── ui/                     # Primitive UI components (icons, collapsible)
│   ├── themed-text.tsx         # Theme-aware Text wrapper
│   ├── themed-view.tsx         # Theme-aware View wrapper
│   ├── haptic-tab.tsx          # Tab button with haptic feedback
│   └── parallax-scroll-view.tsx
│
├── stores/                     # Zustand global state
│   ├── authStore.ts
│   ├── fridgeStore.ts
│   ├── recipesStore.ts
│   └── budgetStore.ts
│
├── services/                   # Data access layer (Supabase + local)
│   ├── supabase.ts             # Supabase client singleton
│   ├── fridgeService.ts
│   ├── recipesService.ts       # AI recipe generation (remote)
│   ├── recipesLocalService.ts  # Saved recipes (local/DB)
│   ├── budgetService.ts
│   └── biometricService.ts
│
├── types/
│   └── index.ts                # All shared interfaces, types, and domain constants
│
├── constants/
│   └── theme.ts                # Colors and Fonts (light/dark)
│
├── hooks/
│   ├── use-color-scheme.ts     # Cross-platform color scheme hook
│   ├── use-color-scheme.web.ts # Web-specific override
│   └── use-theme-color.ts
│
├── migrations/                 # SQL migration files for Supabase
├── data/                       # Static/seed data
├── assets/                     # Images, fonts, icons
├── scripts/                    # Build/maintenance scripts
└── .kiro/                      # Kiro specs and steering
```

## Conventions

- **One screen per file** in `app/`. Screens are default exports.
- **No business logic in screens** — screens consume stores; stores call services.
- **Services are plain objects** with async methods; they interact with Supabase directly.
- **All types and domain constants** live in `types/index.ts`. Do not scatter type definitions across files.
- **Styles at the bottom** of each component file using `StyleSheet.create()`. No inline style objects.
- **Path alias** `@/` resolves to the project root — use it for all internal imports (e.g., `import { useFridgeStore } from '@/stores/fridgeStore'`).
- **Platform-specific files** use `.ios.tsx` / `.web.ts` suffixes (e.g., `icon-symbol.ios.tsx`).
- **`useFocusEffect`** is the standard way to trigger data fetches when a tab/screen comes into focus.
- **`SafeAreaView`** from `react-native-safe-area-context` wraps every top-level screen.
