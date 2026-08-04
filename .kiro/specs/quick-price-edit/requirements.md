# Requirements Document

## Introduction

La pestaña de Compras muestra los productos que están por agotarse o agotados, pero actualmente actualizar el precio de un producto requiere navegar a la pantalla de detalle del item (`fridge/[id]`), lo cual resulta tedioso durante una sesión de compras. Esta feature permite editar el precio de un producto directamente desde la lista de compras mediante una interacción rápida en línea, sin abandonar la pantalla.

## Glossary

- **Shopping_Screen**: Pantalla principal de la pestaña "Compras" que muestra los items pendientes por comprar (status `low` o `empty`).
- **Item_Card**: Componente visual que representa un producto individual dentro de la lista de compras.
- **Price_Editor**: Componente de edición rápida de precio que aparece en línea sobre el Item_Card al ser activado por el usuario.
- **Fridge_Store**: Store de Zustand que gestiona el estado global de los items de la nevera, incluyendo la acción `updateItem`.
- **Fridge_Service**: Capa de servicios que ejecuta las mutaciones contra Supabase para los items de la nevera.
- **Price_Value**: Valor numérico en pesos colombianos (COP) que representa el costo del producto. Acepta valores enteros positivos o null.

## Requirements

### Requirement 1: Activación de edición rápida de precio

**User Story:** Como usuario en la pestaña de Compras, quiero poder activar la edición de precio de un producto sin navegar a otra pantalla, para ahorrar tiempo durante mis compras.

#### Acceptance Criteria

1. WHEN the user taps on the displayed price area of an Item_Card that has a price set, THE Price_Editor SHALL appear inline replacing the price text with an input field pre-populated with the current price value and the numeric keyboard focused
2. WHEN the user taps on the price area of an Item_Card that has no price set (null), THE Price_Editor SHALL appear inline with an empty input field and the numeric keyboard focused
3. WHILE the Price_Editor is active on one Item_Card, THE Shopping_Screen SHALL prevent activation of the Price_Editor on any other Item_Card
4. WHILE the Price_Editor is active, IF the user scrolls the shopping list, THEN THE Price_Editor SHALL close without saving changes and THE Item_Card SHALL display the original price value unchanged
5. THE Item_Card price area SHALL have a minimum tap target size of 44x44 points

### Requirement 2: Entrada y validación del precio

**User Story:** Como usuario, quiero ingresar el nuevo precio usando el teclado numérico, para actualizar el valor de forma rápida y sin errores.

#### Acceptance Criteria

1. WHILE the Price_Editor is active, THE Price_Editor SHALL display a numeric keyboard that only allows digit characters (0-9) as input
2. WHILE the Price_Editor is active, THE Price_Editor SHALL accept only positive integer values between 1 and 99,999,999 (up to 8 digits) as valid input for submission
3. IF the user attempts to submit a value of 0, THEN THE Price_Editor SHALL prevent submission and retain the current input for correction
4. WHILE the Price_Editor is active, THE Price_Editor SHALL display the currency prefix "$" as a non-editable label alongside the input field
5. WHILE the Price_Editor is active, THE Price_Editor SHALL allow submission of an empty input field to represent a null price value

### Requirement 3: Confirmación y persistencia del precio

**User Story:** Como usuario, quiero confirmar el nuevo precio y que se guarde automáticamente, para no perder la actualización.

#### Acceptance Criteria

1. WHEN the user confirms the price edit (by pressing the keyboard done button or a confirm action), THE Fridge_Store SHALL call Fridge_Service to persist the updated price value in the database within 10 seconds
2. WHILE the persistence operation is in progress, THE Price_Editor SHALL disable the confirm action to prevent duplicate submissions
3. WHEN the price is successfully persisted, THE Item_Card SHALL display the new price value formatted with the "$" prefix and close the Price_Editor
4. IF the persistence operation fails, THEN THE Shopping_Screen SHALL display an error alert indicating the save failed and keep the Price_Editor open with the entered value preserved
5. WHEN the user confirms an empty input, THE Fridge_Store SHALL persist null as the price value for that item

### Requirement 4: Cancelación de la edición

**User Story:** Como usuario, quiero poder cancelar la edición de precio sin guardar cambios, para corregir activaciones accidentales.

#### Acceptance Criteria

1. WHEN the user taps outside the active Price_Editor, THE Price_Editor SHALL close without saving changes and without triggering any persistence operation
2. WHEN the user presses the keyboard dismiss gesture (swipe-down on iOS or hardware back button on Android), THE Price_Editor SHALL close without saving changes
3. WHEN the Price_Editor is cancelled, THE Item_Card SHALL display the original price value (or no price if it was null) unchanged from the value present before the Price_Editor was activated
4. WHEN the Price_Editor is cancelled, THE Price_Editor SHALL discard any text entered during the editing session so that subsequent activations do not display stale input

### Requirement 5: Retroalimentación visual durante la edición

**User Story:** Como usuario, quiero ver claramente que estoy editando el precio de un item, para tener contexto visual de la acción en curso.

#### Acceptance Criteria

1. WHILE the Price_Editor is active, THE Item_Card SHALL display a visible border (minimum 2px width) using the application's primary color to indicate edit mode
2. WHILE the price is being persisted, THE Price_Editor SHALL replace the confirm action with an activity indicator (spinner) and SHALL disable user input on the Price_Editor
3. WHEN the price is successfully updated, THE Item_Card SHALL display a background color flash using the application's primary color at reduced opacity, lasting between 300 and 500 milliseconds
4. WHEN the visual confirmation animation completes, THE Item_Card SHALL return to its default visual state (no edit-mode border, no background flash)
5. IF the persistence operation fails, THEN THE Price_Editor SHALL remove the loading indicator and restore the confirm action to its interactive state

### Requirement 6: Compatibilidad con sesión de presupuesto

**User Story:** Como usuario con una sesión de presupuesto activa, quiero que al editar el precio se actualice el total aproximado de la lista, para mantener mi presupuesto al día.

#### Acceptance Criteria

1. WHEN the price is successfully updated and a budget session is active, THE Shopping_Screen SHALL recalculate the "Total aproximado" as the sum of the price values of all items currently visible in the filtered list, treating null prices as 0, and display the result within 1 second of the update
2. WHEN the price is successfully updated and a budget session is not active, THE Shopping_Screen SHALL still recalculate and display the updated "Total aproximado" using the newly persisted price value
3. WHEN an item that previously had no price (null) receives a price value via quick edit, THE Shopping_Screen SHALL include the new price in the "Total aproximado" calculation immediately after persistence
