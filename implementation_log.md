# Tripa Mobile App - Implementation Log

This file details the development, file structure, database choice, and execution steps for the Tripa mobile application.

---

## 1. Project Overview & Choices

* **Goal**: Connect travelers with local taxi drivers. Keep the system lightweight and straightforward.
* **Database Choice**: Local `AsyncStorage` JSON storage on the device. Rides are fully stored and queried offline. Drivers are unique by their mobile number (publishing updates/overwrites their active listing).
* **Styling**: NativeWind v4 (Tailwind CSS v3 design) with a custom modern dark-slate and taxi-gold theme.
* **Component Architecture**: Reusable clean TS components (`Button`, `Input`, `Select`, `Toast`).
* **Navigation**: React Navigation Bottom Tab Bar (Publish Ride, Find Ride).
* **Calling Integration**: Prompts traveler to input their own phone number (saved locally) before opening the native telephone dialer with the driver's contact.

---

## 2. Completed Checklist

* [x] Initialize project with Expo SDK 54 & TypeScript
* [x] Handle spaces in workspace directory by installing inside a temporary folder and moving up
* [x] Install Navigation and Storage dependencies
* [x] Install NativeWind v4 and Tailwind CSS v3 peer dependencies
* [x] Configure tailwind.config.js & babel.config.js for NativeWind v4 compilation
* [x] Establish Type structures (`src/types/index.ts`)
* [x] Implement local JSON/AsyncStorage storage service (`src/services/db.ts`)
* [x] Create modular components:
  * `Input.tsx`: Floating input wrapper with error handling & active focus states.
  * `Button.tsx`: Rounded active pressable buttons with solid, outline, and loading indicator.
  * `Select.tsx`: Horizontal selector segments for modern frequency picker.
  * `Toast.tsx`: Beautiful absolute floating success/error overlay notifications.
* [x] Develop Screens:
  * `PublishRideScreen.tsx`: Validate fields (Driver Name, Phone, Vehicle, Route, Travel Date, Frequency) and save them.
  * `FindRideScreen.tsx`: Search route listings, display custom cards with frequency badges, copy phone numbers to clipboard, and call driver with verification overlay.
* [x] Set up React Navigation stack (`src/navigation/index.tsx`)
* [x] Wire entry file (`App.tsx`) with safe area, navigator, and global stylesheet import (`global.css`)
* [x] Run compilation checks (`npx tsc --noEmit`) to verify 100% type-safety

---

## 3. Project File Guide

* **Entry Point**: [App.tsx](file:///d:/tripa%20revice/tirpa%20mobile%20app/App.tsx)
* **Tailwind CSS Layers**: [global.css](file:///d:/tripa%20revice/tirpa%20mobile%20app/global.css)
* **Custom Types**: [src/types/index.ts](file:///d:/tripa%20revice/tirpa%20mobile%20app/src/types/index.ts)
* **Local Database Service**: [src/services/db.ts](file:///d:/tripa%20revice/tirpa%20mobile%20app/src/services/db.ts)
* **Bottom Tab Router**: [src/navigation/index.tsx](file:///d:/tripa%20revice/tirpa%20mobile%20app/src/navigation/index.tsx)
* **Publish Ride Screen**: [src/screens/PublishRideScreen.tsx](file:///d:/tripa%20revice/tirpa%20mobile%20app/src/screens/PublishRideScreen.tsx)
* **Find Ride Screen**: [src/screens/FindRideScreen.tsx](file:///d:/tripa%20revice/tirpa%20mobile%20app/src/screens/FindRideScreen.tsx)
* **Tailwind Config**: [tailwind.config.js](file:///d:/tripa%20revice/tirpa%20mobile%20app/tailwind.config.js)
* **Babel Config**: [babel.config.js](file:///d:/tripa%20revice/tirpa%20mobile%20app/babel.config.js)
* **Metro Config**: [metro.config.js](file:///d:/tripa%20revice/tirpa%20mobile%20app/metro.config.js)

---

## 4. How to Run & Build

### Development commands
1. **Start Development Server** (clears bundler cache):
   ```bash
   npx expo start --clear
   ```
2. **Run on Android Emulator**:
   ```bash
   npx expo start --android
   ```
3. **Run Type-check Verification**:
   ```bash
   npx tsc --noEmit
   ```

### Building for Android (APK)
To build a production-ready standalone Android APK without requiring EAS cloud servers (local build):
1. **Initialize credentials and configure android project**:
   ```bash
   npx expo prebuild --platform android
   ```
2. **Build Release APK locally** (requires Java JDK 17 and Android SDK installed on Windows):
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The generated APK will be available in: `android/app/build/outputs/apk/release/app-release.apk`*

Alternatively, you can build using Expo Application Services (EAS CLI):
1. **Install EAS CLI**: `npm install -g eas-cli`
2. **Login to Expo Account**: `eas login`
3. **Configure Build profile**: `eas build:configure`
4. **Trigger APK Build**:
   ```bash
   eas build --platform android --profile preview
   ```
