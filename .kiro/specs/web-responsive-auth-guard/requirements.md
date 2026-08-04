# Requirements Document

## Introduction

Esta feature mejora la experiencia de MealPrep en la versión web vista desde escritorio (PC), y corrige el problema de que un usuario no autenticado puede permanecer en pantallas protegidas sin ser redirigido automáticamente al login. Actualmente la app se ve excelente en móvil, pero en pantallas anchas el contenido se estira al 100% del viewport sin límites. Además, el route guard solo funciona en el punto de entrada (`app/index.tsx`) y no protege las rutas `(tabs)` si la sesión expira o si el usuario navega directamente a una URL protegida.

## Glossary

- **Auth_Guard**: Componente de protección de rutas que verifica el estado de autenticación del usuario y redirige a la pantalla de login cuando la sesión no es válida.
- **Session_Listener**: Suscripción al evento `onAuthStateChange` de Supabase que detecta cambios en la sesión (expiración, cierre de sesión remoto) en tiempo real.
- **Responsive_Container**: Contenedor con ancho máximo (`maxWidth`) y centrado horizontal que limita la expansión del contenido en viewports anchos.
- **Breakpoint**: Punto de corte de ancho de pantalla que define cuándo cambia el layout. Se usan los valores: móvil (<768px), tablet (768–1024px), escritorio (>1024px).
- **Web_Layout_Shell**: Componente layout exclusivo de la plataforma web que envuelve las pantallas con el Responsive_Container y opcionalmente una barra lateral de navegación en escritorio.
- **Auth_Store**: Store de Zustand (`authStore.ts`) que gestiona el estado de autenticación del usuario.
- **Tab_Layout**: Layout del grupo de rutas `(tabs)` que contiene la barra de navegación inferior.

## Requirements

### Requirement 1: Protección automática de rutas autenticadas

**User Story:** Como usuario, quiero que la aplicación me redirija automáticamente al login cuando mi sesión no es válida, para que no pueda acceder a contenido protegido sin autenticación.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route within the (tabs) group, THE Auth_Guard SHALL prevent the protected screen content from rendering and redirect the user to the /(unauthenticated)/login route within 500ms.
2. IF the Auth_Store initialization is complete and the user state is null, THEN THE Auth_Guard SHALL navigate the user to the /(unauthenticated)/login route without rendering the protected screen content.
3. WHILE the Auth_Store `initialized` flag is false, THE Auth_Guard SHALL display a full-screen centered ActivityIndicator and SHALL NOT render any protected screen content.
4. WHEN the Session_Listener detects that the session has expired or been revoked, THE Auth_Guard SHALL set the Auth_Store user state to null and redirect to the /(unauthenticated)/login route within 500ms.
5. IF the Auth_Guard encounters an error while verifying the session, THEN THE Auth_Guard SHALL set the Auth_Store user state to null and redirect to the /(unauthenticated)/login route.
6. WHILE a redirect from a protected route to /(unauthenticated)/login is in progress, THE Auth_Guard SHALL continue displaying the loading indicator and SHALL NOT render the target protected screen at any point.

### Requirement 2: Listener de sesión en tiempo real

**User Story:** Como usuario, quiero que la app detecte automáticamente cuando mi sesión expira, para no quedarme en una pantalla sin funcionalidad y tener que buscar manualmente el login.

#### Acceptance Criteria

1. WHEN the application root layout mounts, THE Session_Listener SHALL subscribe to the Supabase `onAuthStateChange` event.
2. WHEN the Session_Listener receives a `SIGNED_OUT` or `TOKEN_REFRESHED` event with a null session, THE Auth_Store SHALL set the user state to null and remove the persisted session entry from AsyncStorage.
3. WHEN the Session_Listener receives a `SIGNED_IN` or `TOKEN_REFRESHED` event with a non-null session containing a user object, THE Auth_Store SHALL update the user state with the session user's `id` and `email` fields and persist the session to AsyncStorage.
4. WHEN the application root layout unmounts, THE Session_Listener SHALL unsubscribe from the `onAuthStateChange` event to prevent memory leaks.
5. WHEN the Auth_Store user state transitions from a non-null value to null, THE application SHALL navigate the user to the unauthenticated route group within 1 second of the state change.

### Requirement 3: Layout responsivo con ancho máximo para web

**User Story:** Como usuario que accede desde un PC, quiero que el contenido de la app se muestre centrado y con un ancho razonable, para que la interfaz no se estire y sea más legible.

#### Acceptance Criteria

1. WHILE the viewport width exceeds 768px and the platform is web, THE Responsive_Container SHALL limit the content width to a maximum of 480px and center the content horizontally using equal margins on both sides.
2. WHILE the viewport width is 768px or less and the platform is web, THE Responsive_Container SHALL allow the content to occupy 100% of the viewport width with no horizontal margin applied by the container.
3. THE Responsive_Container SHALL apply the width constraint only on the web platform; on iOS and Android, THE Responsive_Container SHALL render children at full available width without any maxWidth restriction.
4. WHEN the viewport is resized across the 768px breakpoint, THE Responsive_Container SHALL toggle between constrained (maxWidth 480px, centered) and full-width layouts dynamically without requiring a page reload.
5. WHILE the viewport width exceeds 768px and the platform is web, THE Responsive_Container SHALL display the page background color from the active theme (`Colors[colorScheme].background`) in the area outside the constrained content.

### Requirement 4: Pantalla de login optimizada para escritorio

**User Story:** Como usuario que accede desde un PC, quiero que la pantalla de login se vea presentable y centrada en la pantalla, para tener una experiencia visual profesional.

#### Acceptance Criteria

1. WHILE the viewport width exceeds 768px, THE login screen SHALL display the form inside a container centered both vertically and horizontally, with the container having a maximum width of 400px.
2. WHILE the viewport width exceeds 768px, THE login screen SHALL display the form container with a border-radius of 12px and a box shadow with 0px horizontal offset, 2px vertical offset, 8px blur radius, and 20% opacity black color.
3. WHILE the viewport width is 768px or less, THE login screen SHALL render the existing full-screen mobile layout with no changes to spacing, sizing, or positioning.
4. WHILE the viewport width exceeds 768px, THE login screen SHALL apply the current theme background color token to the card container background and the screen background, adapting to both light and dark color schemes.

### Requirement 5: Barra lateral de navegación para escritorio web

**User Story:** Como usuario en escritorio, quiero tener una barra lateral de navegación en vez de tabs inferiores, para seguir la convención de navegación típica en aplicaciones web de escritorio.

#### Acceptance Criteria

1. WHILE the viewport width exceeds 1024px and the platform is web, THE Web_Layout_Shell SHALL display a fixed left-aligned sidebar navigation containing the same items as the Tab_Layout (Home, Nevera, Recetas, Compras), each rendered with its corresponding icon and label.
2. WHILE the viewport width exceeds 1024px and the platform is web, THE Tab_Layout SHALL hide the bottom tab bar to avoid duplicating navigation elements.
3. WHILE the viewport width is 1024px or less, THE Web_Layout_Shell SHALL hide the sidebar navigation and display the standard bottom tab bar.
4. WHEN the user selects a navigation item from the sidebar, THE Web_Layout_Shell SHALL navigate to the corresponding screen using Expo Router and update the active route indicator within 300ms.
5. WHILE the sidebar navigation is visible, THE Web_Layout_Shell SHALL render the currently active route item's icon and label using the primary brand color token, and render all non-active items using the theme's default icon color token.
6. WHEN the viewport width crosses the 1024px threshold in either direction, THE Web_Layout_Shell SHALL toggle between sidebar and bottom tab bar navigation without requiring a page reload.

### Requirement 6: Persistencia de sesión en recarga web

**User Story:** Como usuario web, quiero que la aplicación recupere mi sesión al recargar la página, para no tener que iniciar sesión cada vez que hago un refresh del navegador.

#### Acceptance Criteria

1. WHEN the application loads and `supabase.auth.getSession()` returns a non-null session, THE Auth_Store SHALL set the user state from that session and set `initialized` to true, so that the Auth_Guard does not evaluate routing until initialization is complete.
2. WHEN the application loads and `supabase.auth.getSession()` returns no active session but a stored session exists in AsyncStorage, THE Auth_Store SHALL call `supabase.auth.setSession()` with the stored tokens, persist the new session to AsyncStorage upon success, set the user state, and set `initialized` to true.
3. IF session restoration fails (stored tokens are absent or `setSession()` returns an error), THEN THE Auth_Store SHALL remove the session entry from AsyncStorage, set the user state to null, and set `initialized` to true.
4. IF session initialization does not complete within 10 seconds, THEN THE Auth_Store SHALL abort the restoration attempt, set the user state to null, set `initialized` to true, and clear stored session data from AsyncStorage.
5. WHILE `initialized` is false, THE Auth_Guard SHALL display a loading indicator and SHALL NOT navigate to any authenticated or unauthenticated route.
