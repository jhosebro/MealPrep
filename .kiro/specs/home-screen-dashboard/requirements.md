# Requirements Document

## Introduction

El Home Screen Dashboard transforma la pantalla de inicio (`app/(tabs)/home.tsx`) en un panel de control visual con cuatro widgets: resumen del presupuesto mensual, gasto del día, items próximos a vencer en la nevera, y un atajo para generar recetas. Todos los datos provienen de los stores Zustand existentes (`budgetStore`, `fridgeStore`, `recipesStore`, `authStore`) sin requerir nuevos endpoints ni tablas en la base de datos. La pantalla se refresca automáticamente cada vez que la pestaña recibe foco mediante `useFocusEffect`.

## Glossary

- **Dashboard**: Pantalla principal (`app/(tabs)/home.tsx`) compuesta por los cuatro widgets.
- **BudgetWidget**: Widget que muestra el presupuesto mensual de compras con barra de progreso.
- **TodaySpendWidget**: Widget que muestra el total gastado hoy derivado de las compras del día.
- **ExpiringWidget**: Widget que lista items de nevera próximos a vencer en los próximos 7 días.
- **RecipeShortcutWidget**: Widget con botón CTA para generar recetas desde el contenido actual de la nevera.
- **BudgetSession**: Sesión de presupuesto activa con campos `amount` (total), `spent` (gastado), `status`.
- **BudgetPurchase**: Registro de compra individual con `price` y `created_at`.
- **FridgeItem**: Item de nevera con `expiry_date`, `name`, `category`, `id`.
- **ExpiringItem**: Tipo derivado (no persistido) que representa un `FridgeItem` con `daysRemaining` calculado.
- **useDashboardData**: Hook personalizado que centraliza el fetching y derivación de datos del dashboard.
- **Dashboard_System**: El sistema completo del dashboard incluyendo hook, funciones puras y widgets.
- **Formatter**: Función utilitaria `formatCurrency` que formata valores numéricos al formato de peso colombiano.
- **BadgeColorResolver**: Función utilitaria `getExpiryBadgeColor` que determina el color del badge según días restantes.

---

## Requirements

### Requirement 1: Widget de Presupuesto Mensual (BudgetWidget)

**User Story:** Como usuario, quiero ver el estado de mi presupuesto mensual de compras en la pantalla de inicio, para saber cuánto he gastado y cuánto me queda disponible de un vistazo.

#### Acceptance Criteria

1. WHEN el usuario navega a la pestaña Home y existe una sesión de presupuesto activa, THE BudgetWidget SHALL mostrar el monto total del presupuesto, el monto gastado y una barra de progreso visual.
2. WHEN el ratio `spent / amount` es menor o igual a 0.80, THE BudgetWidget SHALL colorear la barra de progreso en verde.
3. WHEN el ratio `spent / amount` es mayor a 0.80 y menor o igual a 1.0, THE BudgetWidget SHALL colorear la barra de progreso en ámbar.
4. WHEN el valor `spent` excede el valor `amount`, THE BudgetWidget SHALL colorear la barra de progreso en rojo y mostrar el monto excedido.
5. WHEN no existe una sesión de presupuesto activa, THE BudgetWidget SHALL mostrar el texto "Sin presupuesto activo".
6. WHEN el usuario presiona el BudgetWidget, THE Dashboard_System SHALL navegar a la ruta `/(tabs)/shopping`.

---

### Requirement 2: Widget de Gasto del Día (TodaySpendWidget)

**User Story:** Como usuario, quiero ver cuánto he gastado hoy en compras, para tener conciencia de mi gasto diario sin necesidad de entrar a la sección de compras.

#### Acceptance Criteria

1. WHEN el usuario navega a la pestaña Home, THE TodaySpendWidget SHALL mostrar la suma de todas las compras (`BudgetPurchase`) cuyo `created_at` corresponde a la fecha de hoy.
2. WHEN no existen compras registradas para la fecha de hoy, THE TodaySpendWidget SHALL mostrar `$0`.
3. THE TodaySpendWidget SHALL mostrar el valor en formato de peso colombiano con separador de miles usando punto (ejemplo: `$12.500`).
4. WHEN el usuario presiona el TodaySpendWidget, THE Dashboard_System SHALL navegar a la ruta `/(tabs)/shopping`.

---

### Requirement 3: Widget de Items Próximos a Vencer (ExpiringWidget)

**User Story:** Como usuario, quiero ver qué items de mi nevera están próximos a vencer en los próximos 7 días, para planificar su consumo y evitar desperdiciar alimentos.

#### Acceptance Criteria

1. WHEN el usuario navega a la pestaña Home, THE ExpiringWidget SHALL mostrar únicamente los items de nevera cuyo `expiry_date` cae entre hoy (inclusive) y los próximos 7 días calendario (inclusive).
2. THE ExpiringWidget SHALL mostrar los items ordenados de forma ascendente por `daysRemaining` (el que vence más pronto aparece primero).
3. WHEN un item tiene `daysRemaining` igual a 0 o igual a 1, THE ExpiringWidget SHALL mostrar el badge del item en color rojo.
4. WHEN un item tiene `daysRemaining` igual a 2 o igual a 3, THE ExpiringWidget SHALL mostrar el badge del item en color ámbar.
5. WHEN un item tiene `daysRemaining` mayor o igual a 4, THE ExpiringWidget SHALL mostrar el badge del item en color verde (color primario del tema).
6. WHEN el número de items próximos a vencer supera 5, THE ExpiringWidget SHALL mostrar los primeros 5 items y un enlace "+N más" donde N es el número de items adicionales.
7. WHEN no existen items próximos a vencer en la ventana de 7 días, THE ExpiringWidget SHALL mostrar el texto "Todo en orden 🎉".
8. WHEN el usuario presiona un item del ExpiringWidget, THE Dashboard_System SHALL navegar a la ruta `app/fridge/[id]` correspondiente al item presionado.
9. WHEN un FridgeItem tiene `expiry_date` nulo, THE ExpiringWidget SHALL excluir ese item de la lista de próximos a vencer.

---

### Requirement 4: Widget de Atajo de Recetas (RecipeShortcutWidget)

**User Story:** Como usuario, quiero poder generar recetas con el contenido actual de mi nevera desde la pantalla de inicio con un solo toque, para acceder rápidamente a sugerencias de comida.

#### Acceptance Criteria

1. WHEN la nevera contiene al menos un item, THE RecipeShortcutWidget SHALL mostrar un botón CTA activo para generar recetas.
2. WHEN la nevera está vacía (`fridgeStore.items` es un array vacío), THE RecipeShortcutWidget SHALL deshabilitar el botón CTA y mostrar el texto "Agrega ingredientes a tu nevera primero".
3. WHEN el usuario presiona el botón CTA y la generación está en curso, THE RecipeShortcutWidget SHALL mostrar un spinner de carga y el texto "Generando…".
4. WHEN la generación de recetas finaliza exitosamente, THE Dashboard_System SHALL navegar automáticamente a la ruta `/(tabs)/recipes`.
5. WHEN la generación de recetas falla, THE RecipeShortcutWidget SHALL mostrar un mensaje de error y re-habilitar el botón para que el usuario pueda intentarlo nuevamente.

---

### Requirement 5: Hook de Datos del Dashboard (useDashboardData)

**User Story:** Como desarrollador, quiero un hook centralizado que provea todos los datos del dashboard derivados de los stores, para mantener la pantalla de inicio libre de lógica de fetching y transformación.

#### Acceptance Criteria

1. THE Dashboard_System SHALL implementar el hook `useDashboardData` que suscribe a `budgetStore`, `fridgeStore`, `recipesStore` y `authStore`.
2. WHEN el hook `useDashboardData` es invocado, THE Dashboard_System SHALL exponer `budget`, `budgetLoading`, `todaySpend`, `expiringItems`, `ingredientNames`, `generating` y `refresh`.
3. THE Dashboard_System SHALL derivar `todaySpend` usando `useMemo` con `purchases` como dependencia para evitar recálculos innecesarios.
4. THE Dashboard_System SHALL derivar `expiringItems` usando `useMemo` con `fridgeStore.items` como dependencia.
5. WHEN la pantalla Home recibe foco (`useFocusEffect`), THE Dashboard_System SHALL llamar automáticamente a `refresh()` para actualizar los datos.
6. WHEN `refresh()` es invocado, THE Dashboard_System SHALL ejecutar en paralelo `fetchActive(userId)` de `budgetStore` y `fetchItems(userId)` de `fridgeStore`.
7. IF `authStore.user` es null, THEN THE Dashboard_System SHALL omitir las llamadas de fetching sin lanzar errores.

---

### Requirement 6: Función de Derivación de Items Próximos a Vencer (computeExpiringItems)

**User Story:** Como desarrollador, quiero una función pura que calcule los items próximos a vencer, para poder testearla de forma aislada y usarla desde el hook del dashboard.

#### Acceptance Criteria

1. WHEN `computeExpiringItems` recibe un array de `FridgeItem` y una ventana de días, THE Dashboard_System SHALL retornar únicamente los items donde `daysRemaining >= 0` y `daysRemaining <= windowDays`.
2. THE Dashboard_System SHALL calcular `daysRemaining` como la diferencia en días calendario entre `expiry_date` y el inicio del día de hoy (`startOfToday()`).
3. WHEN `computeExpiringItems` recibe items con `expiry_date` nulo, THE Dashboard_System SHALL excluir esos items del resultado.
4. THE Dashboard_System SHALL retornar el array de `ExpiringItem` ordenado de forma ascendente por `daysRemaining`.
5. WHEN `computeExpiringItems` recibe un array vacío, THE Dashboard_System SHALL retornar un array vacío.

---

### Requirement 7: Función de Derivación de Gasto del Día (computeTodaySpend)

**User Story:** Como desarrollador, quiero una función pura que sume las compras del día actual, para poder testearla de forma aislada y asegurar que el cálculo es correcto.

#### Acceptance Criteria

1. WHEN `computeTodaySpend` recibe un array de `BudgetPurchase`, THE Dashboard_System SHALL retornar la suma de `price` de todas las compras cuyo `created_at` comienza con el prefijo ISO de la fecha de hoy (`YYYY-MM-DD`).
2. WHEN `computeTodaySpend` recibe un array vacío o ninguna compra corresponde a la fecha de hoy, THE Dashboard_System SHALL retornar `0`.
3. THE Dashboard_System SHALL garantizar que el valor retornado por `computeTodaySpend` sea siempre mayor o igual a cero.

---

### Requirement 8: Función de Progreso de Presupuesto (computeBudgetProgress)

**User Story:** Como desarrollador, quiero una función pura que calcule el ratio de progreso del presupuesto y su etiqueta descriptiva, para separar la lógica de presentación del widget.

#### Acceptance Criteria

1. WHEN `computeBudgetProgress` recibe una `BudgetSession` válida, THE Dashboard_System SHALL retornar un objeto con `ratio`, `overBudget` y `label`.
2. THE Dashboard_System SHALL calcular `ratio` como `min(spent / amount, 1.0)` para que el valor esté siempre en el rango `[0.0, 1.0]`.
3. WHEN `spent` excede `amount`, THE Dashboard_System SHALL establecer `overBudget` en `true` y `label` con el texto "Excedido por $X" donde X es el monto formateado.
4. WHEN `spent` no excede `amount`, THE Dashboard_System SHALL establecer `overBudget` en `false` y `label` con el texto "$X restante" donde X es el monto formateado.
5. WHEN `computeBudgetProgress` recibe `null`, THE Dashboard_System SHALL retornar `{ ratio: 0, overBudget: false, label: 'Sin presupuesto' }`.

---

### Requirement 9: Función Utilitaria de Formato de Moneda (formatCurrency)

**User Story:** Como desarrollador, quiero una función utilitaria que formatee valores numéricos al formato de peso colombiano, para mostrar montos consistentes en todos los widgets.

#### Acceptance Criteria

1. WHEN `formatCurrency` recibe un número entero, THE Formatter SHALL retornar una cadena con separador de miles usando punto según la convención del peso colombiano (ejemplo: `12500` → `'12.500'`).
2. WHEN `formatCurrency` recibe el valor `0`, THE Formatter SHALL retornar `'0'`.
3. WHEN `formatCurrency` recibe un número menor a 1000, THE Formatter SHALL retornar la representación numérica sin separador (ejemplo: `500` → `'500'`).
4. THE Formatter SHALL garantizar que el resultado de `formatCurrency` sea siempre una cadena no vacía para cualquier número finito.

---

### Requirement 10: Función Utilitaria de Color de Badge de Vencimiento (getExpiryBadgeColor)

**User Story:** Como desarrollador, quiero una función pura que determine el color del badge de vencimiento según los días restantes, para mantener la lógica de colores consistente y testeable.

#### Acceptance Criteria

1. WHEN `getExpiryBadgeColor` recibe `daysRemaining` igual a 0 o igual a 1, THE BadgeColorResolver SHALL retornar el color rojo (`#EF4444`).
2. WHEN `getExpiryBadgeColor` recibe `daysRemaining` igual a 2 o igual a 3, THE BadgeColorResolver SHALL retornar el color ámbar (`#F59E0B`).
3. WHEN `getExpiryBadgeColor` recibe `daysRemaining` mayor o igual a 4, THE BadgeColorResolver SHALL retornar el color primario del tema (`colors.primary`).
4. THE BadgeColorResolver SHALL garantizar que `getExpiryBadgeColor` nunca retorne `null` ni `undefined` para valores de `daysRemaining` en el rango `[0, 7]`.

---

### Requirement 11: Manejo de Errores de Fetching

**User Story:** Como usuario, quiero que el dashboard me informe cuando no se pueden cargar los datos y me permita reintentar, para no quedarme con información desactualizada sin saberlo.

#### Acceptance Criteria

1. WHEN `budgetStore` o `fridgeStore` establecen un estado de error durante el fetching, THE Dashboard_System SHALL mostrar un mensaje de error inline ("No se pudo cargar la información") en la pantalla.
2. WHEN se muestra un error de fetching, THE Dashboard_System SHALL mostrar un botón "Reintentar" que al presionarse invoque `refresh()`.
3. WHEN la generación de recetas falla y `recipesStore.error` es no nulo, THE Dashboard_System SHALL mostrar un mensaje de error en el `RecipeShortcutWidget`.

---

### Requirement 12: Compatibilidad con Modo Oscuro y Claro

**User Story:** Como usuario, quiero que el dashboard respete el tema visual (oscuro o claro) de mi dispositivo, para tener una experiencia visual consistente con el resto de la aplicación.

#### Acceptance Criteria

1. THE Dashboard_System SHALL utilizar exclusivamente tokens de color del objeto `Colors[colorScheme]` proveniente de `constants/theme.ts` para todos los elementos visuales de los widgets.
2. WHEN el dispositivo cambia entre modo oscuro y modo claro, THE Dashboard_System SHALL reflejar el cambio de tema en todos los widgets sin requerir reinicio de la aplicación.
3. THE Dashboard_System SHALL pasar el objeto `colors` como prop a cada widget en lugar de que los widgets accedan al tema de forma independiente.
