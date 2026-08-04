# Design Document

## Overview

Esta feature aborda dos problemas principales de MealPrep en web:

1. **Auth Guard faltante**: Actualmente solo `app/index.tsx` verifica autenticación. Si un usuario navega directamente a una URL protegida o su sesión expira, permanece en la pantalla sin ser redirigido. Se implementará un Auth Guard en el layout de `(tabs)` que escuche cambios de sesión en tiempo real.

2. **Layout no responsivo en web**: El contenido se estira al 100% del viewport en pantallas anchas. Se implementará un sistema de contenedor responsivo con `maxWidth`, y una barra lateral de navegación para escritorio (>1024px) que reemplaza los tabs inferiores.

La solución se basa en componentes platform-specific (`.web.ts`), el hook `useWindowDimensions` para reactividad al resize, y la suscripción a `onAuthStateChange` de Supabase centralizada en el root layout.

## Architecture

```mermaid
graph TD
    subgraph "Root Layout (_layout.tsx)"
        SL[Session Listener]
    end

    subgraph "Auth Store (Zustand)"
        AS[user | initialized | loading]
    end

    subgraph "(tabs)/_layout.tsx"
        AG[Auth Guard]
        TL[Tab Layout]
    end

    subgraph "Web Layout Shell (web only)"
        RC[Responsive Container]
        SN[Sidebar Navigation]
    end

    SL -->|onAuthStateChange| AS
    AG -->|reads user & initialized| AS
    AG -->|redirect if null| LOGIN[/(unauthenticated)/login]
    AG -->|render children| TL
    TL -->|web platform| RC
    RC -->|viewport > 1024px| SN
```

### Decisiones de diseño

1. **Auth Guard en `(tabs)/_layout.tsx`**: Se coloca el guard en el layout del grupo protegido en vez de un wrapper externo. Esto garantiza que cualquier ruta bajo `(tabs)` pase por la verificación antes de renderizar contenido.

2. **Session Listener en Root Layout**: La suscripción a `onAuthStateChange` vive en `app/_layout.tsx` para que se inicie una sola vez al montar la app y se limpie al desmontar. Actualiza el `authStore` de forma centralizada.

3. **Responsive Container como componente web-only**: Se usa un archivo `.web.tsx` para el contenedor responsivo. En native, simplemente renderiza `children` sin wrapper extra. Esto evita lógica de plataforma en componentes compartidos.

4. **Sidebar como reemplazo condicional de tabs**: Cuando el viewport supera 1024px en web, el sidebar se muestra y el tab bar se oculta via `tabBarStyle: { display: 'none' }`. Ambos usan Expo Router para navegar, asegurando consistencia de estado.

5. **`useWindowDimensions` sobre media queries CSS**: React Native Web soporta `useWindowDimensions` que re-renderiza al cambiar dimensiones. Es más natural en el ecosistema RN que inyectar CSS media queries.

## Components and Interfaces

### AuthGuard (componente en `(tabs)/_layout.tsx`)

Lógica inline dentro del layout de tabs que verifica `user` e `initialized` del `authStore` antes de renderizar el contenido.

```typescript
// Dentro de app/(tabs)/_layout.tsx
function TabLayout() {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/(unauthenticated)/login');
    }
  }, [initialized, user]);

  if (!initialized || (!user && initialized)) {
    return <LoadingScreen />;
  }

  // Renderizar tabs normalmente
}
```

### SessionListener (en `app/_layout.tsx`)

Hook/efecto que suscribe a `supabase.auth.onAuthStateChange` y sincroniza el `authStore`.

```typescript
// Dentro de app/_layout.tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        await AsyncStorage.removeItem(SESSION_KEY);
        useAuthStore.getState().setUser(null);
      } else if (session?.user) {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        useAuthStore.getState().setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### ResponsiveContainer (`components/responsive-container.web.tsx` / `components/responsive-container.tsx`)

| Prop | Tipo | Descripción |
|------|------|-------------|
| children | ReactNode | Contenido a envolver |
| maxWidth | number | Ancho máximo (default: 480) |

**Web implementation** (`responsive-container.web.tsx`):
```typescript
export function ResponsiveContainer({ children, maxWidth = 480 }: Props) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isConstrained = width > 768;

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={[
        styles.inner,
        isConstrained && { maxWidth, alignSelf: 'center' }
      ]}>
        {children}
      </View>
    </View>
  );
}
```

**Native implementation** (`responsive-container.tsx`):
```typescript
export function ResponsiveContainer({ children }: Props) {
  return <>{children}</>;
}
```

### WebLayoutShell (`components/web-layout-shell.web.tsx` / `components/web-layout-shell.tsx`)

Componente que envuelve la pantalla con sidebar en desktop web.

| Prop | Tipo | Descripción |
|------|------|-------------|
| children | ReactNode | Contenido de la pantalla activa |

**Comportamiento**:
- viewport > 1024px: muestra sidebar fija a la izquierda (ancho ~220px) + contenido a la derecha
- viewport ≤ 1024px: solo renderiza `children` (tabs manejan la navegación)

### SidebarNavigation (`components/sidebar-navigation.web.tsx`)

Componente web-only que renderiza los items de navegación verticalmente.

| Prop | Tipo | Descripción |
|------|------|-------------|
| activeRoute | string | Ruta activa actual |

Items de navegación (mismos que Tab_Layout):
- Home (`/(tabs)/home`) — icono `house.fill`
- Nevera (`/(tabs)/fridge`) — icono `refrigerator`
- Recetas (`/(tabs)/recipes`) — icono `book.fill`
- Compras (`/(tabs)/shopping`) — icono `cart.fill`

### LoginCard (mejora en `app/(unauthenticated)/login.tsx`)

Mejora al login existente: en web con viewport > 768px, el formulario se envuelve en un card centrado con sombra y border-radius.

### Nuevas acciones en authStore

```typescript
// Acciones adicionales en authStore
setUser: (user: { id: string; email?: string } | null) => void;
clearSession: () => Promise<void>;
```

## Data Models

### AuthState (modificado)

```typescript
interface AuthState {
  user: { id: string; email?: string } | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Acciones existentes
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;

  // Nuevas acciones
  setUser: (user: { id: string; email?: string } | null) => void;
  clearSession: () => Promise<void>;
}
```

### ResponsiveContainerProps

```typescript
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}
```

### WebLayoutShellProps

```typescript
interface WebLayoutShellProps {
  children: React.ReactNode;
}
```

### NavigationItem (tipo interno del sidebar)

```typescript
interface NavigationItem {
  route: string;
  label: string;
  icon: string;
}
```

### Breakpoints (constantes)

```typescript
const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

const RESPONSIVE_DEFAULTS = {
  contentMaxWidth: 480,
  loginCardMaxWidth: 400,
  sidebarWidth: 220,
} as const;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth guard blocks rendering when user is null

*For any* auth state where `initialized` is true and `user` is null, the Auth Guard SHALL NOT render protected children and SHALL trigger a redirect to the login route.

**Validates: Requirements 1.1, 1.2, 2.5**

### Property 2: Auth guard shows loading while uninitialized

*For any* auth state where `initialized` is false (regardless of user value), the Auth Guard SHALL render only a loading indicator and SHALL NOT render protected children nor trigger any navigation.

**Validates: Requirements 1.3, 6.5**

### Property 3: Session listener sign-out clears user state

*For any* Supabase auth event of type `SIGNED_OUT` or `TOKEN_REFRESHED` with a null session, the session listener SHALL set the Auth Store user to null and remove the session entry from AsyncStorage.

**Validates: Requirements 1.4, 2.2**

### Property 4: Session listener sign-in sets user state

*For any* Supabase auth event of type `SIGNED_IN` or `TOKEN_REFRESHED` with a non-null session containing a user object, the session listener SHALL set the Auth Store user to `{ id: session.user.id, email: session.user.email }` and persist the session to AsyncStorage.

**Validates: Requirements 2.3**

### Property 5: Responsive container width constraint at 768px breakpoint

*For any* viewport width on the web platform, the Responsive Container SHALL apply `maxWidth: 480` and center alignment when width > 768px, and SHALL NOT apply any width constraint when width ≤ 768px.

**Validates: Requirements 3.1, 3.2**

### Property 6: Responsive container native pass-through

*For any* viewport width on native platforms (iOS/Android), the Responsive Container SHALL render children at full available width without applying any `maxWidth` restriction.

**Validates: Requirements 3.3**

### Property 7: Navigation mode toggles at 1024px breakpoint

*For any* viewport width on the web platform, when width > 1024px the sidebar navigation SHALL be visible and the bottom tab bar SHALL be hidden, and when width ≤ 1024px the sidebar SHALL be hidden and the bottom tab bar SHALL be visible.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Sidebar active item uses primary color

*For any* active route from the set of navigation items (home, fridge, recipes, shopping), the sidebar SHALL render that item's icon and label with the primary brand color token, and all other items with the default icon color token.

**Validates: Requirements 5.5**

### Property 9: Session initialization resolves user from valid session

*For any* valid session object (either from `getSession()` directly or from `setSession()` with stored tokens), the Auth Store `initialize` function SHALL set user to `{ id, email }` from the session and set `initialized` to true.

**Validates: Requirements 6.1, 6.2**

## Error Handling

### Auth Guard Errors

| Escenario | Comportamiento |
|-----------|----------------|
| `initialize()` lanza excepción | Set `user = null`, `initialized = true`. Guard redirige a login. |
| `supabase.auth.getSession()` falla | Intentar restaurar desde AsyncStorage. Si también falla, set `user = null`, `initialized = true`. |
| `supabase.auth.setSession()` falla | Remover session de AsyncStorage, set `user = null`, `initialized = true`. |
| Timeout de inicialización (>10s) | Abortar, set `user = null`, `initialized = true`, limpiar AsyncStorage. |
| Error en `onAuthStateChange` callback | Log del error, no mutar el estado. El guard continúa con el último estado conocido. |

### Principio fail-safe

En todos los casos de error relacionados con autenticación, el sistema falla hacia el estado no autenticado (redirect a login). Nunca se muestra contenido protegido ante incertidumbre sobre la validez de la sesión.

### Session Listener Error Recovery

- Si `AsyncStorage.setItem` falla al persistir sesión: log warning, no afecta el estado en memoria (el usuario sigue autenticado en la sesión actual).
- Si `AsyncStorage.removeItem` falla al limpiar sesión: log warning, el store ya setea `user = null` por lo que el guard protege igual.

### Responsive/UI Errors

- Si `useWindowDimensions` retorna 0 (caso edge en SSR): tratar como viewport móvil (sin constraints).
- Si el sidebar no puede resolver la ruta activa: resaltar "Home" como fallback.

## Testing Strategy

### Property-Based Tests (fast-check)

Se usará **fast-check** como librería de property-based testing para TypeScript/JavaScript.

Cada property test debe:
- Ejecutar mínimo 100 iteraciones
- Referenciar la propiedad del design con un tag comment
- Format: `// Feature: web-responsive-auth-guard, Property {N}: {description}`

**Propiedades a implementar con PBT:**

1. **Auth guard rendering decision**: Generar estados aleatorios `{ user: User | null, initialized: boolean }` y verificar que el guard produce el output correcto (loading, redirect, o render children).

2. **Session listener event handling**: Generar eventos aleatorios `{ event: AuthEventType, session: Session | null }` y verificar que el store se actualiza correctamente.

3. **Responsive container style output**: Generar viewport widths aleatorios (1–3000px) y plataformas (web/ios/android) y verificar los estilos resultantes.

4. **Navigation mode selection**: Generar viewport widths aleatorios y verificar que sidebar/tabs visibility es correcta.

5. **Sidebar active item styling**: Generar rutas aleatorias del set de navigation items y verificar colores correctos.

6. **Session initialization**: Generar sesiones aleatorias (válidas, null, erróneas) y verificar el estado resultante del store.

### Unit Tests (example-based)

- Login card: verificar estilos en viewport ancho vs. angosto (light + dark mode)
- Redirect timing: verificar que no se renderiza flash de contenido protegido
- Viewport resize: verificar transición dinámica sin reload
- Sidebar navigation click: verificar que `router.push` se llama con ruta correcta
- Subscription cleanup: verificar `unsubscribe` en unmount
- Timeout de 10s: mock timer, verificar abort y cleanup

### Integration Tests

- Flujo completo: login → navigate to tabs → session expire → redirect a login
- Page reload: verificar que sesión se restaura correctamente
- Direct URL access sin sesión: verificar redirect inmediato

### Herramientas

- **Jest** + **React Native Testing Library** para unit/property tests
- **fast-check** para generación de inputs aleatorios
- Mocks para `supabase.auth`, `AsyncStorage`, `useRouter`, `useWindowDimensions`
