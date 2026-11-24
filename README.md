# Daylist

A small Vue to-do list that stores tasks in the browser with the native IndexedDB API. It needs no application server or remote database; Vite is used only for local development and building static files.

## Run locally

Install the dependencies, then start the Vite development server:

```sh
npm install
npm run dev
```

To create static production files in `dist/`:

```sh
npm run build
```

Tasks are saved in the `daylist` IndexedDB database on the current browser profile and device. Clearing browser site data will remove them.

## Android app

Daylist can also be packaged as an Android app with Capacitor 8. Use Node.js 22 or newer, Android Studio 2025.2.1 or newer, and an Android SDK platform for API 24 or newer. Android Studio supplies the JDK used by Gradle. Then run:

```sh
npm install
npm run android:open
```

In Android Studio, open the `android/` project, select a connected phone or emulator, and use **Build > Build Bundle(s) / APK(s) > Build APK(s)**. To build from the terminal instead, run `npm run android:build`.

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. On your phone, allow installation from the file source you use, then open the APK to install Daylist. Tasks continue to be stored locally on that device.
