# Convenciones del Proyecto

## Idioma

- **Código fuente**: inglés (nombres de variables, funciones, componentes, tipos, comentarios técnicos)
- **UI / strings visibles al usuario**: español colombiano (labels, mensajes de error, texto de botones, placeholders)
- **Spec docs** (`.kiro/specs/**/*.md`): el contenido puede estar en español, pero los **encabezados de sección requeridos deben estar en inglés exacto** para pasar el validador de Kiro:
  - `## Overview`, `## Architecture`, `## Components and Interfaces`, `## Data Models`, `## Correctness Properties`, `## Error Handling`, `## Testing Strategy`
  - Las propiedades de corrección deben usar `**Validates: Requirements X.Y**` (no traducir esta línea)

## Manejo de Errores en Stores (Zustand)

Todos los stores siguen el mismo patrón. No introducir variaciones:

```typescript
// Estado base obligatorio en todo store
interface SomeState {
  data: T[];
  loading: boolean;
  error: string | null;
}

// Patrón de acción async
someAction: async (...) => {
  set({ loading: true, error: null });
  try {
    const result = await someService.method(...);
    set({ data: result, loading: false });
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},
```

## Capa de Servicios

- Los servicios son objetos planos con métodos async — **nunca clases**.
- Nunca llamar a `supabase` directamente desde un componente o store. Siempre pasar por `services/`.
- Los servicios lanzan errores (`throw error`) — el store es quien los captura.

## Componentes

- Un componente por archivo. Exportación `default` para pantallas, exportaciones nombradas para componentes compartidos.
- `StyleSheet.create({})` siempre al **final** del archivo, después del componente.
- Cero objetos de estilo inline (`style={{ ... }}`). Toda regla va en `StyleSheet.create`.
- Colores: usar siempre tokens del objeto `colors` recibido como prop o de `Colors[colorScheme]`. Nunca hardcodear hex values directamente en estilos, salvo las constantes de color definidas al inicio del archivo (fuera del componente).
- Nunca acceder al tema de forma independiente dentro de un widget — recibirlo como prop `colors`.

## Navegación

- Usar siempre el path alias `@/` para imports internos. Nunca rutas relativas con `../`.
- Navegación a rutas dinámicas: `router.push(\`/fridge/\${id}\` as any)` — el `as any` es intencional por limitaciones del tipado de Expo Router con rutas dinámicas.
- `useFocusEffect` + `useCallback` es el patrón estándar para refrescar datos al entrar a una pantalla/tab.

## Tipos

- Todos los tipos compartidos, interfaces y constantes de dominio viven en `types/index.ts`.
- No crear archivos de tipos adicionales ni definir tipos locales en componentes si son reutilizables.
- Constantes de dominio como arrays de opciones se exportan como `const` con `as const` para inferencia de tipos estricta.

## Convenciones de Archivos

- Nombres de archivos en `kebab-case` (ej. `use-color-scheme.ts`, `fridge-service.ts`).
- Archivos específicos de plataforma usan sufijos: `.ios.tsx`, `.web.ts`.
- Stores: `camelCase` + sufijo `Store` (ej. `fridgeStore.ts`).
- Servicios: `camelCase` + sufijo `Service` (ej. `fridgeService.ts`).
- Hooks: prefijo `use-` en kebab-case (ej. `use-dashboard-data.ts`).

## Variables de Entorno

- Todas las variables públicas deben tener prefijo `EXPO_PUBLIC_` para ser accesibles en el bundle.
- Leer siempre desde `process.env.EXPO_PUBLIC_*` con fallback vacío (`|| ""`).
- Nunca commitar valores reales de `.env`.
