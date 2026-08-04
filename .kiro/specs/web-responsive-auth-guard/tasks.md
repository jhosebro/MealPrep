# Implementation Plan: Web Responsive Auth Guard

## Overview

Implementar un Auth Guard para proteger rutas autenticadas, un Session Listener en tiempo real, un layout responsivo con ancho máximo para web, sidebar de navegación para escritorio, y persistencia de sesión en recarga. Se usan componentes platform-specific (`.web.tsx`), `useWindowDimensions` para reactividad, y `onAuthStateChange` de Supabase.

## Tasks

- [x] 1. Extend Auth Store and add shared types
  - [x] 1.1 Add new interfaces and breakpoint constants to `types/index.ts`
    - Add `ResponsiveContainerProps`, `WebLayoutShellProps`, `NavigationItem` interfaces
    - Add `BREAKPOINTS` and `RESPONSIVE_DEFAULTS` constants
    - _Requirements: 3.1, 3.2, 5.1_

  - [x] 1.2 Add `setUser` and `clearSession` actions to `stores/authStore.ts`
    - Add `setUser(user)` action that directly sets the user state
    - Add `clearSession()` action that removes session from AsyncStorage and sets user to null
    - Ensure `initialized` flag behavior remains consistent
    - _Requirements: 1.2, 2.2, 6.3_

  - [x] 1.3 Update `initialize()` in `stores/authStore.ts` to support session restoration with timeout
    - Call `supabase.auth.getSession()` first; if valid session, set user and `initialized = true`
    - If no active session, check AsyncStorage for stored tokens and call `supabase.auth.setSession()`
    - Add 10-second timeout that aborts and clears state on failure
    - On any error, remove stored session, set user null, set `initialized = true`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x]* 1.4 Write property test for session initialization (Property 9)
    - **Property 9: Session initialization resolves user from valid session**
    - Generate random session objects (valid, null, error cases) with fast-check
    - Verify Auth Store sets correct user and `initialized` state
    - **Validates: Requirements 6.1, 6.2**

- [x] 2. Implement Session Listener in Root Layout
  - [x] 2.1 Add `onAuthStateChange` subscription to `app/_layout.tsx`
    - Subscribe on mount inside a `useEffect`
    - On `SIGNED_OUT` or `TOKEN_REFRESHED` with null session: call `clearSession()`
    - On `SIGNED_IN` or `TOKEN_REFRESHED` with valid session: persist to AsyncStorage and call `setUser()`
    - Unsubscribe on unmount
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 2.2 Write property test for session listener event handling (Property 3 & 4)
    - **Property 3: Session listener sign-out clears user state**
    - **Property 4: Session listener sign-in sets user state**
    - Generate random auth events and sessions with fast-check
    - Verify store state mutations match expected behavior
    - **Validates: Requirements 1.4, 2.2, 2.3**

- [x] 3. Implement Auth Guard in `(tabs)/_layout.tsx`
  - [x] 3.1 Add auth guard logic to `app/(tabs)/_layout.tsx`
    - Read `user` and `initialized` from `useAuthStore()`
    - If `initialized === false`: render full-screen centered `ActivityIndicator`
    - If `initialized === true && user === null`: call `router.replace('/(unauthenticated)/login')`
    - Only render tab content when `initialized === true && user !== null`
    - Ensure no flash of protected content during redirect
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 2.5_

  - [x]* 3.2 Write property tests for Auth Guard rendering decision (Property 1 & 2)
    - **Property 1: Auth guard blocks rendering when user is null**
    - **Property 2: Auth guard shows loading while uninitialized**
    - Generate random `{ user, initialized }` states with fast-check
    - Verify guard output: loading, redirect, or render children
    - **Validates: Requirements 1.1, 1.2, 1.3, 6.5**

- [x] 4. Checkpoint - Ensure auth flow works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Responsive Container component
  - [x] 5.1 Create `components/responsive-container.web.tsx`
    - Accept `children` and optional `maxWidth` (default 480)
    - Use `useWindowDimensions()` to get viewport width
    - Apply `maxWidth` and `alignSelf: 'center'` when width > 768px
    - Apply theme background color in outer container
    - Use `StyleSheet.create` for all styles
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 5.2 Create `components/responsive-container.tsx` (native passthrough)
    - Accept same props but render only `{children}` with no wrapper or width constraint
    - _Requirements: 3.3_

  - [x]* 5.3 Write property tests for Responsive Container (Property 5 & 6)
    - **Property 5: Responsive container width constraint at 768px breakpoint**
    - **Property 6: Responsive container native pass-through**
    - Generate random viewport widths (1–3000px) and platforms with fast-check
    - Verify style output matches breakpoint logic
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 6. Implement Sidebar Navigation and Web Layout Shell
  - [x] 6.1 Create `components/sidebar-navigation.web.tsx`
    - Render navigation items vertically: Home, Nevera, Recetas, Compras with icons and labels
    - Accept `activeRoute` prop; highlight active item with primary brand color (`#4CAF50`)
    - Non-active items use theme default icon color
    - Use `router.push()` on item press
    - Fixed width of 220px, use `StyleSheet.create` for all styles
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 6.2 Create `components/web-layout-shell.web.tsx`
    - Use `useWindowDimensions()` to detect viewport width
    - When width > 1024px: render sidebar + content area in horizontal flex layout
    - When width ≤ 1024px: render only `children`
    - _Requirements: 5.1, 5.3, 5.6_

  - [x] 6.3 Create `components/web-layout-shell.tsx` (native passthrough)
    - Render only `{children}` with no wrapper
    - _Requirements: 5.3_

  - [x]* 6.4 Write property test for navigation mode toggle (Property 7)
    - **Property 7: Navigation mode toggles at 1024px breakpoint**
    - Generate random viewport widths with fast-check
    - Verify sidebar visibility and tab bar visibility based on breakpoint
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x]* 6.5 Write property test for sidebar active item styling (Property 8)
    - **Property 8: Sidebar active item uses primary color**
    - Generate random active routes from navigation items set with fast-check
    - Verify active item uses primary color token, others use default
    - **Validates: Requirements 5.5**

- [x] 7. Integrate responsive layout into Tab Layout
  - [x] 7.1 Update `app/(tabs)/_layout.tsx` to use WebLayoutShell and hide tab bar on desktop
    - Wrap tab content with `WebLayoutShell`
    - Conditionally set `tabBarStyle: { display: 'none' }` when viewport > 1024px on web
    - Wrap screen content with `ResponsiveContainer`
    - _Requirements: 5.2, 5.6, 3.1_

- [x] 8. Optimize login screen for desktop web
  - [x] 8.1 Update `app/(unauthenticated)/login.tsx` with desktop card layout
    - When viewport > 768px on web: wrap form in a centered card with maxWidth 400px, borderRadius 12, boxShadow
    - When viewport ≤ 768px: render existing mobile layout unchanged
    - Use theme background color tokens for card and screen background
    - Support both light and dark color schemes
    - Use `StyleSheet.create` for all styles
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Platform-specific files use `.web.tsx` suffix per project conventions
- All imports use the `@/` path alias
- All styles use `StyleSheet.create` — no inline style objects
- Colors always reference theme tokens, never hardcoded hex values (except constants)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "5.1", "5.2"] },
    { "id": 2, "tasks": ["1.3", "5.3", "6.1"] },
    { "id": 3, "tasks": ["1.4", "2.1", "6.2", "6.3"] },
    { "id": 4, "tasks": ["2.2", "3.1", "6.4", "6.5"] },
    { "id": 5, "tasks": ["3.2", "7.1"] },
    { "id": 6, "tasks": ["8.1"] }
  ]
}
```
