# Implementation Plan: Home Screen Dashboard

## Overview

Transforma `app/(tabs)/home.tsx` en un dashboard con cuatro widgets (`BudgetWidget`, `TodaySpendWidget`, `ExpiringWidget`, `RecipeShortcutWidget`). El orden de implementación sigue las dependencias: utilidades puras → hook → widgets → pantalla principal.

## Tasks

- [ ] 1. Instalar `fast-check` como devDependency
  - Ejecutar `npm install --save-dev fast-check` en la raíz del proyecto
  - Verificar que `fast-check` aparece en `devDependencies` de `package.json`
  - _Requirements: N/A — prerequisito de testing_

- [ ] 2. Crear tipos e interfaz `ExpiringItem` en `types/index.ts`
  - [ ] 2.1 Agregar la interfaz `ExpiringItem` al archivo `types/index.ts`
    - Campos: `id: string`, `name: string`, `category: string`, `expiryDate: string`, `daysRemaining: number`
    - Colocar la interfaz junto a las demás interfaces del dominio
    - _Requirements: REQ-3, REQ-6_

- [ ] 3. Crear archivo de funciones puras del dashboard en `utils/dashboard.ts`
  - [ ] 3.1 Implementar `formatCurrency(value: number): string`
    - Formatear número con separador de miles usando punto (convención peso colombiano)
    - Ejemplo: `12500 → '12.500'`, `500 → '500'`, `0 → '0'`
    - No incluir decimales para valores enteros
    - _Requirements: REQ-9_
  - [ ] 3.2 Implementar `getExpiryBadgeColor(daysRemaining: number, colors: typeof Colors.light): string`
    - Retornar `'#EF4444'` (rojo) cuando `daysRemaining <= 1`
    - Retornar `'#F59E0B'` (ámbar) cuando `daysRemaining` es 2 o 3
    - Retornar `colors.primary` (verde) cuando `daysRemaining >= 4`
    - _Requirements: REQ-10_
  - [ ] 3.3 Implementar `computeExpiringItems(items: FridgeItem[], windowDays?: number): ExpiringItem[]`
    - Usar `windowDays = 7` como valor por defecto
    - Calcular `daysRemaining` con diferencia en días calendario desde `startOfToday()`
    - Excluir items con `expiry_date` nulo
    - Incluir solo items donde `0 <= daysRemaining <= windowDays`
    - Retornar el array ordenado ascendente por `daysRemaining`
    - Implementar cálculo de fechas con operaciones nativas de `Date` (sin dependencias externas de runtime)
    - _Requirements: REQ-6_
  - [ ] 3.4 Implementar `computeTodaySpend(purchases: BudgetPurchase[]): number`
    - Derivar el prefijo de fecha de hoy en formato `YYYY-MM-DD`
    - Filtrar compras cuyo `created_at` comienza con ese prefijo
    - Sumar los `price` de las compras filtradas
    - Retornar `0` para array vacío o sin compras de hoy
    - _Requirements: REQ-7_
  - [ ] 3.5 Implementar `computeBudgetProgress(session: BudgetSession | null): { ratio: number; overBudget: boolean; label: string }`
    - Retornar `{ ratio: 0, overBudget: false, label: 'Sin presupuesto' }` cuando `session` es `null`
    - Calcular `ratio = Math.min(session.spent / session.amount, 1.0)`
    - Establecer `overBudget = session.spent > session.amount`
    - Construir `label` con `formatCurrency` para el monto restante o excedido
    - _Requirements: REQ-8_

- [ ] 4. Escribir property-based tests para las funciones puras (archivo `utils/__tests__/dashboard.test.ts`)
  - [ ]* 4.1 Property test: `computeExpiringItems` — window invariant
    - **Property 1: Expiry Window Invariant**
    - Generar arrays arbitrarios de `FridgeItem` con `expiry_date` variados (incluir nulls, pasados, futuros)
    - Verificar que todo item retornado tiene `daysRemaining >= 0` y `daysRemaining <= 7`
    - Verificar que ningún item con `expiry_date` nulo aparece en el resultado
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-6.1, REQ-6.2, REQ-6.3, REQ-3.1**
  - [ ]* 4.2 Property test: `computeExpiringItems` — ordering invariant
    - **Property 2: Expiry Ordering Invariant**
    - Verificar que para cualquier par consecutivo `(a, b)` en el resultado, `a.daysRemaining <= b.daysRemaining`
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-6.4, REQ-3.2**
  - [ ]* 4.3 Property test: `computeTodaySpend` — filters by today
    - **Property 3: Today Spend Filters by Date**
    - Generar arrays de `BudgetPurchase` con fechas de hoy, ayer y días futuros mezcladas
    - Verificar que el resultado iguala exactamente la suma de precios solo de las compras de hoy
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-7.1, REQ-2.1**
  - [ ]* 4.4 Property test: `computeTodaySpend` — non-negative
    - **Property 4: Today Spend Non-Negative**
    - Para cualquier array de purchases con `price >= 0`, verificar que el resultado es `>= 0`
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-7.3**
  - [ ]* 4.5 Property test: `computeBudgetProgress` — ratio clamped
    - **Property 5: Budget Progress Ratio Clamped**
    - Generar `BudgetSession` arbitrarias incluyendo casos donde `spent > amount`
    - Verificar que `ratio` siempre está en `[0.0, 1.0]`
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-8.2, REQ-1.2, REQ-1.3, REQ-1.4**
  - [ ]* 4.6 Property test: `computeBudgetProgress` — color threshold
    - **Property 6: Budget Progress Color Threshold**
    - Generar sesiones con `spent/amount` en los tres rangos (≤0.80, 0.81–1.0, >1.0)
    - Verificar que `overBudget` es `true` solo cuando `spent > amount`
    - Verificar que `label` contiene "Excedido" cuando `overBudget` es `true` y "restante" cuando no lo es
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-1.2, REQ-1.3, REQ-1.4, REQ-8.3, REQ-8.4**
  - [ ]* 4.7 Property test: `getExpiryBadgeColor` — correct color by range
    - **Property 7: Expiry Badge Color by Range**
    - Para `daysRemaining` en `{0, 1}` → verificar color `'#EF4444'`
    - Para `daysRemaining` en `{2, 3}` → verificar color `'#F59E0B'`
    - Para `daysRemaining` en `{4, 5, 6, 7}` → verificar color `colors.primary`
    - Verificar que nunca retorna `null` ni `undefined`
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4**
  - [ ]* 4.8 Property test: `formatCurrency` — thousands separator
    - **Property 8: Currency Format Thousands Separator**
    - Generar enteros no negativos arbitrarios
    - Verificar que el resultado es una cadena no vacía
    - Verificar que números >= 1000 contienen al menos un punto como separador
    - Verificar que `formatCurrency(12500)` retorna `'12.500'`
    - Mínimo 100 iteraciones
    - **Validates: Requirements REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4**

- [ ] 5. Checkpoint — Verificar funciones puras
  - Asegurarse de que todos los tests de la tarea 4 pasan correctamente. Consultar al usuario si surgen dudas sobre el comportamiento esperado.

- [ ] 6. Implementar hook `useDashboardData` en `hooks/use-dashboard-data.ts`
  - [ ] 6.1 Crear el archivo `hooks/use-dashboard-data.ts` con la interfaz `DashboardData`
    - Importar y suscribirse a `useBudgetStore`, `useFridgeStore`, `useRecipesStore`, `useAuthStore`
    - Definir y exportar la interfaz `DashboardData` con campos: `budget`, `budgetLoading`, `todaySpend`, `expiringItems`, `ingredientNames`, `generating`, `refresh`
    - _Requirements: REQ-5.1, REQ-5.2_
  - [ ] 6.2 Implementar derivación de `todaySpend` con `useMemo`
    - Usar `computeTodaySpend(purchases)` como función de derivación
    - Dependencia del `useMemo`: `purchases` del `budgetStore`
    - _Requirements: REQ-5.3_
  - [ ] 6.3 Implementar derivación de `expiringItems` con `useMemo`
    - Usar `computeExpiringItems(items, 7)` como función de derivación
    - Dependencia del `useMemo`: `items` del `fridgeStore`
    - _Requirements: REQ-5.4_
  - [ ] 6.4 Implementar la función `refresh()`
    - Invocar en paralelo `fetchActive(userId)` y `fetchItems(userId)` cuando `user` no es null
    - Omitir el fetching sin lanzar error cuando `user` es null
    - Estabilizar la referencia con `useCallback`
    - _Requirements: REQ-5.6, REQ-5.7_
  - [ ]* 6.5 Escribir tests de integración para `useDashboardData`
    - Usar `@testing-library/react-native` con stores mockeados mediante `jest`
    - Verificar que `todaySpend` y `expiringItems` se actualizan al cambiar los stores
    - Verificar que `refresh()` invoca `fetchActive` y `fetchItems` en paralelo
    - _Requirements: REQ-5_

- [ ] 7. Implementar `BudgetWidget` en `components/BudgetWidget.tsx`
  - [ ] 7.1 Crear el componente `BudgetWidget` con las props `{ session, loading, colors }`
    - Importar `BudgetSession` de `@/services/budgetService` y `Colors` de `@/constants/theme`
    - Mostrar "Sin presupuesto activo" cuando `session` es null
    - Mostrar `loading` skeleton/spinner cuando `loading` es true
    - _Requirements: REQ-1.5_
  - [ ] 7.2 Renderizar barra de progreso y montos
    - Usar `computeBudgetProgress(session)` para obtener `ratio`, `overBudget` y `label`
    - Mostrar monto total (`session.amount`) y monto gastado (`session.spent`) formateados con `formatCurrency`
    - Renderizar `View` con ancho proporcional a `ratio * 100%` como barra de progreso
    - _Requirements: REQ-1.1_
  - [ ] 7.3 Aplicar colores dinámicos a la barra de progreso según umbrales
    - Verde (`colors.primary` o `#4CAF50`) cuando `ratio <= 0.80`
    - Ámbar (`#F59E0B`) cuando `ratio > 0.80` y `!overBudget`
    - Rojo (`#EF4444`) cuando `overBudget`
    - Usar `TouchableOpacity` como contenedor raíz para habilitar la navegación
    - _Requirements: REQ-1.2, REQ-1.3, REQ-1.4_
  - [ ] 7.4 Agregar estilos con `StyleSheet.create()` al final del archivo
    - Todos los colores deben usar tokens del objeto `colors` o las constantes de color definidas
    - Soporte completo modo oscuro/claro mediante el prop `colors`
    - _Requirements: REQ-12_
  - [ ]* 7.5 Escribir unit tests para `BudgetWidget`
    - Test: renderiza "Sin presupuesto activo" cuando `session` es null
    - Test: barra verde con `spent = 50`, `amount = 100`
    - Test: barra ámbar con `spent = 90`, `amount = 100`
    - Test: barra roja con `spent = 110`, `amount = 100`
    - _Requirements: REQ-1_

- [ ] 8. Implementar `TodaySpendWidget` en `components/TodaySpendWidget.tsx`
  - [ ] 8.1 Crear el componente `TodaySpendWidget` con props `{ todaySpend, currency, colors }`
    - Mostrar el valor `todaySpend` formateado con `formatCurrency`
    - Anteponer el símbolo de moneda (`currency = '$'`)
    - Mostrar `$0` cuando `todaySpend` es 0
    - Usar `TouchableOpacity` como contenedor raíz
    - _Requirements: REQ-2.1, REQ-2.2, REQ-2.3_
  - [ ] 8.2 Agregar estilos con `StyleSheet.create()` al final del archivo
    - _Requirements: REQ-12_
  - [ ]* 8.3 Escribir unit tests para `TodaySpendWidget`
    - Test: renderiza `$0` cuando `todaySpend` es 0
    - Test: renderiza `$12.500` cuando `todaySpend` es 12500
    - _Requirements: REQ-2_

- [ ] 9. Implementar `ExpiringWidget` en `components/ExpiringWidget.tsx`
  - [ ] 9.1 Crear el componente `ExpiringWidget` con props `{ items, colors, onItemPress }`
    - Renderizar "Todo en orden 🎉" cuando `items` es un array vacío
    - _Requirements: REQ-3.7_
  - [ ] 9.2 Renderizar la lista de items con badge de color y días restantes
    - Mostrar como máximo 5 items usando `items.slice(0, 5)`
    - Cada fila muestra nombre del item, chip de categoría y días restantes
    - Usar `getExpiryBadgeColor(item.daysRemaining, colors)` para el color del badge
    - _Requirements: REQ-3.3, REQ-3.4, REQ-3.5_
  - [ ] 9.3 Implementar el enlace "+N más" cuando hay más de 5 items
    - Calcular N como `items.length - 5`
    - Mostrar el enlace solo cuando `items.length > 5`
    - _Requirements: REQ-3.6_
  - [ ] 9.4 Conectar `onItemPress` con cada fila de item
    - Envolver cada fila en `TouchableOpacity` que invoca `onItemPress(item.id)`
    - _Requirements: REQ-3.8_
  - [ ] 9.5 Agregar estilos con `StyleSheet.create()` al final del archivo
    - _Requirements: REQ-12_
  - [ ]* 9.6 Escribir unit tests para `ExpiringWidget`
    - Test: renderiza "Todo en orden 🎉" con array vacío
    - Test: muestra enlace "+N más" cuando hay más de 5 items
    - Test: renderiza badge rojo para item con `daysRemaining = 0`
    - Test: renderiza badge ámbar para item con `daysRemaining = 2`
    - _Requirements: REQ-3_

- [ ] 10. Implementar `RecipeShortcutWidget` en `components/RecipeShortcutWidget.tsx`
  - [ ] 10.1 Crear el componente `RecipeShortcutWidget` con props `{ ingredientCount, generating, onGenerate, colors }`
    - Renderizar `TouchableOpacity` con texto "✨ Generar Receta"
    - Deshabilitar el botón cuando `ingredientCount === 0`
    - _Requirements: REQ-4.1, REQ-4.2_
  - [ ] 10.2 Implementar estado de generación en curso
    - Mostrar `ActivityIndicator` y texto "Generando…" cuando `generating` es `true`
    - Deshabilitar el botón mientras `generating` es `true`
    - _Requirements: REQ-4.3_
  - [ ] 10.3 Mostrar texto de ayuda cuando la nevera está vacía
    - Renderizar "Agrega ingredientes a tu nevera primero" bajo el botón deshabilitado
    - _Requirements: REQ-4.2_
  - [ ] 10.4 Agregar estilos con `StyleSheet.create()` al final del archivo
    - _Requirements: REQ-12_
  - [ ]* 10.5 Escribir unit tests para `RecipeShortcutWidget`
    - Test: botón deshabilitado y texto de ayuda cuando `ingredientCount = 0`
    - Test: spinner visible cuando `generating = true`
    - Test: botón activo cuando `ingredientCount > 0` y `generating = false`
    - _Requirements: REQ-4_

- [ ] 11. Checkpoint — Verificar widgets en aislamiento
  - Asegurarse de que todos los unit tests de los widgets (tareas 7–10) pasan. Consultar al usuario si hay dudas sobre diseño visual o comportamiento.

- [ ] 12. Reescribir `app/(tabs)/home.tsx` componiendo el dashboard
  - [ ] 12.1 Reemplazar el cuerpo de `HomeScreen` con la nueva estructura de dashboard
    - Envolver la pantalla en `SafeAreaView` de `react-native-safe-area-context`
    - Usar `ScrollView` como contenedor del contenido principal
    - Conservar el modal de configuración (biométrico + cerrar sesión) sin cambios
    - _Requirements: REQ-5_
  - [ ] 12.2 Integrar `useDashboardData` y conectar `useFocusEffect`
    - Invocar `useDashboardData()` para obtener todos los datos del dashboard
    - Envolver `refresh()` en `useCallback` y pasarlo a `useFocusEffect`
    - _Requirements: REQ-5.5, REQ-5.6_
  - [ ] 12.3 Componer los cuatro widgets con sus props
    - `<BudgetWidget session={budget} loading={budgetLoading} colors={colors} />`
    - `<TodaySpendWidget todaySpend={todaySpend} currency="$" colors={colors} />`
    - `<ExpiringWidget items={expiringItems} colors={colors} onItemPress={(id) => router.push(\`/fridge/\${id}\` as any)} />`
    - `<RecipeShortcutWidget ingredientCount={ingredientNames.length} generating={generating} onGenerate={handleGenerate} colors={colors} />`
    - _Requirements: REQ-1, REQ-2, REQ-3, REQ-4_
  - [ ] 12.4 Implementar `handleGenerate` y la navegación post-generación
    - Llamar `generateRecipes(user.id, ingredientNames)` del `recipesStore`
    - Navegar a `/(tabs)/recipes` tras lanzar la generación
    - Guardar guard: retornar si `user` es null o `ingredientNames.length === 0`
    - _Requirements: REQ-4.4_
  - [ ] 12.5 Implementar manejo de errores inline
    - Mostrar banner de error cuando `budgetStore.error` o `fridgeStore.error` son no nulos
    - Incluir botón "Reintentar" que invoca `refresh()`
    - _Requirements: REQ-11.1, REQ-11.2_
  - [ ] 12.6 Eliminar imports y lógica obsoleta del archivo anterior
    - Remover `FlatList`, `useEffect`, `nearDepletion`, lógica de `loading` local y tarjetas antiguas
    - Mantener solo los imports necesarios para el nuevo dashboard
    - _Requirements: N/A — limpieza_
  - [ ]* 12.7 Escribir tests de integración para `HomeScreen`
    - Usar stores mockeados con `jest` y `@testing-library/react-native`
    - Test: `useFocusEffect` dispara `fetchActive` y `fetchItems` al recibir foco
    - Test: error de fetching muestra banner con botón "Reintentar"
    - Test: botón "Reintentar" invoca `refresh()`
    - _Requirements: REQ-5.5, REQ-11_

- [ ] 13. Checkpoint Final — Verificar integración completa
  - Asegurarse de que todos los tests (property tests, unit tests e integration tests) pasan sin errores. Verificar que TypeScript no reporta errores con `tsc --noEmit`. Consultar al usuario antes de dar la implementación por terminada.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3"] },
    { "wave": 3, "tasks": ["4", "5"] },
    { "wave": 4, "tasks": ["6"] },
    { "wave": 5, "tasks": ["7", "8", "9", "10"] },
    { "wave": 6, "tasks": ["11"] },
    { "wave": 7, "tasks": ["12"] },
    { "wave": 8, "tasks": ["13"] }
  ]
}
```

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- El orden de las tareas refleja las dependencias: utils (3) → hook (6) → widgets (7–10) → pantalla (12).
- Todos los colores de los widgets deben usar tokens del objeto `colors` pasado como prop; nunca hardcodear hex values directamente en estilos.
- `fast-check` (instalado en tarea 1) se usa exclusivamente en los tests de las tareas 4.x.
- Los estilos de cada componente nuevo van con `StyleSheet.create()` al final del archivo, siguiendo las convenciones del proyecto.
- El path alias `@/` debe usarse en todos los imports internos.
