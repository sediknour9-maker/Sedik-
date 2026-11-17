# Atlas Fit

A fitness and calorie-tracking app for Morocco, built with Expo (SDK 57), React Native and TypeScript.
Everything is stored on the device; there are no accounts and no server.

## Features

- **Onboarding** – language, body stats, activity level and goal; daily calorie and macro targets are computed from them.
- **Today (Home)** – calories left, macros, quick actions (log food, scan, weight), today's workout, daily goals, water, week strip and streak.
- **Training** – a generated strength plan (gym or home), guided workouts with sets, weights and rest timer, cardio logging, and a mobility player.
- **Nutrition** – diary per day with day navigation, meal cards, editable entries, food search with recents and category filter, portion picker with Moroccan units, custom foods and barcode lookup (OpenFoodFacts).
- **Progress** – streak and session tiles, weight trend chart and log, 7‑day calorie chart against the goal.
- **Profile** – summary, targets, edit profile, language, Ramadan mode, community link, data reset.
- **Morocco specifics** – 25 Moroccan dishes plus 20 generic foods, local portion units (bowl, plate, piece …), Ramadan mode with Suhoor and Iftar.
- **Languages** – English, French, German and Arabic (right-to-left).

## Run it

```bash
npm install --legacy-peer-deps
npx expo start            # scan the QR code with Expo Go, or press w for web
npm test                  # unit tests (Jest)
npm run typecheck         # TypeScript
npm run build:web-single  # web export + one self-contained HTML page in dist/
```

## Project layout

```
app/                      screens (expo-router): (onboarding), (tabs), add-food, workout, mobility, scan-barcode, profile-edit
src/components/ui/        design-system primitives (Txt, Row, Card, Button, Chip, TextField, Segmented, ConfirmDialog …)
src/components/charts/    TrendLineChart, ColumnChart and their scale helpers
src/components/           feature components (CalorieSummary, MealCard, FoodRow, WaterTracker, WeekStrip …)
src/store/                React contexts (profile, logs, activity, foods, water, plan, settings, data reset)
src/services/             pure logic and storage (calories, plan, streaks, Ramadan, dates, repositories)
src/data/                 foods, exercises, Ramadan dates
src/i18n/locales/         en, fr, de, ar
src/theme/                colors, chart colors, spacing/radius tokens, RTL helpers
__tests__/                Jest unit tests
scripts/                  build-single-html.js
```

## Conventions

- Read the versioned Expo docs before changing APIs (see `AGENTS.md`): https://docs.expo.dev/versions/v57.0.0/
- Right-to-left comes from `useRTL()` and the `Row`/`Txt` primitives, not from `I18nManager`.
- Every string exists in all four locale files with the same keys; Arabic uses all six plural forms.
- Colors, spacing and radii come from `src/theme`; build screens from `src/components/ui`.
- Stored keys start with `app:`; a data reset clears them all except settings.
- Interactive elements carry `testID`s for end-to-end tests.
- Destructive actions go through `confirmAction()`, which shows an in-app dialog on web.

## Status and next steps

Done and tested on web (unit tests, type check, browser end-to-end runs in English and Arabic):
design system and brand graphics, onboarding, Home, Training, Nutrition, Progress and Profile.

Open:

1. Test on real Android and iOS devices (Expo Go or a development build), especially the camera barcode scanner, keyboard behaviour and safe areas.
2. Barcode lookup needs internet access to OpenFoodFacts; check it on a device.
3. Replace the placeholder community link (`COMMUNITY_DISCORD_URL` in `app/(tabs)/profile.tsx`) with the real invite.
4. Weight entries can only be replaced by logging again on the same day; deleting or editing older entries is not built yet.
5. Burned calories appear in the diary for today only.
6. Have the nutrition values of the dishes checked by a nutritionist.
7. A screen-reader pass on a device (charts already expose their values as accessibility labels).
8. Store release: EAS build configuration, store listing and screenshots.
