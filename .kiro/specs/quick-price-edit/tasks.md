# Implementation Plan: Quick Price Edit

## Overview

Implement inline price editing on the Shopping screen, allowing users to tap a price area on any Item_Card to open a `PriceEditor` component that validates input, persists the new value via `fridgeStore.updateItem`, and provides visual feedback on success or error. Utility functions `validatePriceInput` and `computeShoppingTotal` are extracted for testability. Property-based tests validate correctness properties using fast-check.

## Tasks

- [x] 1. Create utility functions and types for price editing
  - [x] 1.1 Add `PriceValidationResult` interface and `PriceEditState` interface to `types/index.ts`
    - Add `PriceValidationResult` with `valid: boolean` and `value: number | null`
    - Add `PriceEditState` with `editingItemId`, `savingPrice`, `flashItemId`
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 1.2 Create `utils/validate-price-input.ts` with `validatePriceInput` function
    - Implement validation logic: empty string → `{ valid: true, value: null }`, integer 1–99,999,999 → valid, otherwise → invalid
    - Export the function for use in PriceEditor and tests
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 1.3 Create `utils/compute-shopping-total.ts` with `computeShoppingTotal` function
    - Accepts `FridgeItem[]`, returns sum of non-null prices treating null as 0
    - Export the function for use in ShoppingScreen and tests
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 1.4 Write property test for `validatePriceInput` (Property 1)
    - **Property 1: Validación de precio es correcta y completa**
    - Use fast-check to generate arbitrary strings and verify: empty trim → null, valid integer in range → value, everything else → invalid
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

  - [ ]* 1.5 Write property test for `computeShoppingTotal` (Property 3)
    - **Property 3: Cálculo del total aproximado**
    - Use fast-check to generate arrays of items with `price: number | null` and verify sum equals expected, always ≥ 0
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 2. Implement the PriceEditor component
  - [x] 2.1 Create `components/price-editor.tsx` component
    - Accept props: `currentPrice`, `saving`, `onConfirm`, `onCancel`, `colors`
    - Render `TextInput` with `keyboardType="number-pad"` and auto-focus
    - Pre-populate with current price or empty string if null
    - Display non-editable "$" label to the left of the input
    - On confirm: validate with `validatePriceInput`, call `onConfirm` only if valid
    - Show spinner replacing confirm button when `saving === true`
    - Disable input when `saving === true`
    - Use `StyleSheet.create` for all styles, consume `colors` prop for theming
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 5.2_

  - [ ]* 2.2 Write unit tests for PriceEditor component
    - Test pre-population with existing price and null price
    - Test that confirm is disabled when saving
    - Test that invalid input (0, empty for reject case) does not trigger onConfirm
    - Test that valid input triggers onConfirm with parsed value
    - _Requirements: 2.1, 2.2, 2.3, 5.2_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate PriceEditor into ShoppingScreen
  - [x] 4.1 Add price edit state management to `app/(tabs)/shopping.tsx`
    - Add `editingItemId`, `savingPrice`, and `flashItemId` local state
    - Implement `handlePriceConfirm` async handler that calls `updateItem`, handles success (close editor, flash), and handles error (Alert, keep editor open)
    - Implement `handlePriceCancel` that sets `editingItemId` to null
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Modify `renderItem` in ShoppingScreen to support inline price editing
    - Wrap price area in `TouchableOpacity` with `minWidth: 44`, `minHeight: 44`
    - On tap: activate PriceEditor if no other editor is active (check `editingItemId === null`)
    - Conditionally render `PriceEditor` when `editingItemId === item.id`
    - Show 2px primary-color border on ItemCard when editing
    - Show primary-color background flash (15% opacity, 300–500ms) on successful save via `flashItemId`
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.1, 5.3, 5.4_

  - [x] 4.3 Add scroll-to-cancel and tap-outside-to-cancel behavior
    - Add `onScrollBeginDrag` to SectionList that cancels active editor
    - Wrap screen content so tapping outside the active PriceEditor calls cancel
    - _Requirements: 1.4, 4.1, 4.2_

  - [x] 4.4 Replace inline `total` calculation with `computeShoppingTotal` utility
    - Import and use `computeShoppingTotal` in the `useMemo` that calculates `total`
    - Ensure the total recalculates immediately after a successful price update
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.5 Write property test for cancelation invariant (Property 2)
    - **Property 2: Cancelación no muta el precio del item**
    - Mock fridgeStore, activate PriceEditor with arbitrary text, cancel, verify store price unchanged
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Visual feedback and error handling polish
  - [x] 6.1 Implement confirmation flash animation on ItemCard
    - Use `Animated.View` with opacity transition for the background flash (primary color at 15% opacity)
    - Duration 300–500ms, then reset to default state
    - _Requirements: 5.3, 5.4_

  - [x] 6.2 Implement error handling and loading states
    - Show `ActivityIndicator` in PriceEditor when saving
    - On error, display `Alert.alert('Error', 'No se pudo guardar el precio. Intenta de nuevo.')`
    - Restore confirm button after error
    - _Requirements: 3.4, 5.2, 5.5_

  - [ ]* 6.3 Write integration tests for ShoppingScreen price editing flow
    - Test tap on price → PriceEditor appears
    - Test confirm → `updateItem` called with correct params
    - Test error in `updateItem` → Alert shown, editor stays open
    - Test scroll during edit → editor closes without persistence
    - _Requirements: 1.1, 1.4, 3.1, 3.4_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout; all implementation uses TypeScript
- All styles use `StyleSheet.create`, colors from theme tokens
- The `utils/` directory is used for pure utility functions to keep them testable in isolation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "1.5", "2.1"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "6.1", "6.2"] },
    { "id": 5, "tasks": ["6.3"] }
  ]
}
```
