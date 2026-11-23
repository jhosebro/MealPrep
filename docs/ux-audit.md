# Evaluación UX/UI — MealPrep (web + móvil)

Fecha: 2026-11-23 · Rama: `security/hardening`

## Resumen

La base visual (clay/neumórfica, tema claro/oscuro, layout web con sidebar) es sólida. Los mayores problemas estaban en los **estados de carga y error**, la **falta de caché** (cada arranque mostraba pantallas vacías) y la **falta de introducción** para usuarios nuevos. Esos puntos y todo lo que estaba pendiente ya están implementados.

## Implementado

| Área | Problema | Cambio |
|---|---|---|
| Carga | En Inicio, Nevera y Compras, "cargando" se veía igual que "vacío" ("No tienes alimentos" durante el primer fetch). Recetas usaba un spinner suelto. | `components/skeleton.tsx` (`Skeleton`, `SkeletonList`): pulso con Reanimated, respeta *reduce motion*, `accessibilityRole="progressbar"`. Usado en las 4 pestañas. |
| Error | La Nevera no mostraba fallos de red: quedaba vacía sin explicación. | Estado de error con "Reintentar" si no hay datos; banner no bloqueante "mostrando datos guardados" si sí los hay. |
| Búsqueda | Sin resultados no ofrecía salida. | Botón "Limpiar filtros". |
| Caché | Cada arranque arrancaba en vacío hasta que respondía Supabase; sin conexión no se veía nada. | `persist` de Zustand sobre AsyncStorage (`lib/cache.ts`) en nevera, presupuesto y recetas guardadas. Se borra en `signOut`/`clearSession` (privacidad entre cuentas). Escenario BDD lo cubre. |
| Onboarding | Usuario nuevo caía directo al login sin saber qué hace la app. | `app/onboarding.tsx`: 3 pasos (nevera, recetas, compras), Saltar/Atrás/Siguiente/Empezar, indicador de paso accesible, `maxWidth` 480 en web. Se muestra una sola vez por dispositivo (`onboarding_done`), solo a usuarios sin sesión. |
| Táctil / a11y | "Exportar", "Finalizar", "‹ Volver" y "Eliminar" eran solo texto (<44pt) sin rol. | `hitSlop={12}`, `accessibilityRole="button"` y etiqueta. |
| Web | El bundle web se quedaba en el splash (`import.meta` en el ESM de `zustand/middleware`). | `metro.config.js` resuelve el build CJS. |
| Eliminar | Solo con long-press (no descubrible). | Botón papelera visible en cada tarjeta de Nevera (hermano del botón de la tarjeta: en web no se anidan `<button>`). Long-press se mantiene. |
| a11y | Tarjetas, limpiar búsqueda y pestañas internas de Recetas sin etiqueta/rol. | Tarjeta lee "nombre, cantidad unidad, estado"; "Limpiar búsqueda"; pestañas con `role="tab"` + `selected`; FAB "Crear receta". |
| Error | Compras y Recetas quedaban vacías ante fallos de red. | Mismo patrón que Nevera: mensaje + "Reintentar". |
| Código | Cierre de sesión duplicado en `home.tsx`; spinner duplicado en `(tabs)/_layout.tsx`. | Usa `showConfirm`; un solo spinner `!initialized \|\| !user`. |
| Web | Formularios a ancho completo en pantallas grandes. | Agregar/editar alimento y crear receta: `maxWidth: 720` centrado. |
| Haptics | Sin feedback en confirmaciones destructivas en móvil. | `showConfirm` dispara haptic de advertencia antes del diálogo nativo. |
| Contraste | Dudas con `textSecondary` sobre `primarySoft`. | Verificado, sin cambios: 5.27:1 (oscuro) y 4.82:1 (claro), ≥4.5:1. |

## Modo demo (ver la app sin cuenta)

```bash
npm run web:demo
```

- `EXPO_PUBLIC_DEMO=1` hace que `metro.config.js` resuelva `services/supabase.ts` → `services/supabase.demo.ts` (Supabase falso en memoria con usuario `demo@local`, 5 alimentos, presupuesto activo y 2 recetas).
- No toca el Supabase real ni pide contraseña; los datos se pierden al recargar el bundle.
- Doble candado: la redirección solo aplica si `NODE_ENV !== "production"`, y el archivo demo lanza error si `!__DEV__`.
- Pendiente: swipe para eliminar en móvil y la misma papelera en Compras (allí ya hay "Archivar" visible).

## Riesgos conocidos

- La caché vive en AsyncStorage/localStorage **sin cifrar** (nombres de alimentos, compras, recetas). No hay credenciales ni tokens ahí (la sesión sigue en `secureSessionStorage`).
- Carrera de hidratación: si la caché termina de hidratar después del primer fetch, podría pisar datos frescos un instante (documentado en `lib/cache.ts`; en la práctica AsyncStorage hidrata antes que responde la red).
