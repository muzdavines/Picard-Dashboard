# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Grocery ordering MVP (scope + pantry)

The Grocery page now supports three practical ordering flows:

1. **This week winners**: build from dinner vote winners (existing weekly flow).
2. **Select meals manually**: choose one or more meals from `MEAL_LIBRARY` and build from those meal ingredients.
3. **Pantry verification**: mark items as **Always** (always in pantry) or **On hand** (currently available) so they are excluded from the Walmart send list.

### Pantry behavior

- Ingredients marked `isPantryStaple` in meal metadata are auto-excluded by default.
- User pantry profile is persisted in `localStorage` (`picard-pantry-profile-v1`) and reused for future list builds.
- Per-item **Exclude** still exists as a manual override for the current list.
- Before sending to Walmart+, the UI shows summary counts for:
  - total items
  - excluded by pantry/on-hand
  - to-be-sent items
