# Google sign-in inside URUJOBS

The Android app registers `UrujobsGoogleAuth`, a Capacitor plugin that opens Android Credential Manager. The web app exchanges its Google ID token for a Supabase session without opening a browser. Existing APKs need to be rebuilt and reinstalled; publishing the website alone does not add the native plugin.

## Configuration

- Web OAuth client ID: `813244036156-3ekdfa8up7oi9orcvl60gl4pkmthdbtk.apps.googleusercontent.com` (public, stored in Android string resources).
- In Google Cloud, create an **Android OAuth client** for package `uy.com.urujobs` and each SHA-1 signing certificate used to install the app. Use the debug certificate for development and the **Play app-signing certificate**, not only the upload certificate, for Play-distributed builds. Keep the Android and Web clients in the same Google project.
- Enable Google in Supabase Authentication → Providers. Its accepted client IDs must include the Web client ID above. Keep nonce validation enabled. This native flow does not require a redirect or an Android deep link.
- The plugin permits calls only from `https://apply-at-a-glance.lovable.app`, matching `capacitor.config.ts`. Update both if the app domain changes.
- Firebase Messaging configuration is separate from OAuth. This checkout has no `android/app/google-services.json`; supply the existing project's configuration for notification-enabled builds. Do not create a new Firebase project.

## Build and test on Android

Use Android Studio with JDK 21 and Android SDK 36. Sync Capacitor before building if generated Cordova/configuration files are missing (`bunx cap sync android` with the project's generated web output available). The app currently loads the published website, so publish the matching web changes before testing the new APK.

1. In Android Studio, run Gradle `:app:signingReport` to obtain the development SHA-1; register it in the Android OAuth client.
2. Install a rebuilt debug APK on a phone with Google Play services and at least one Google account.
3. Open Profile → sign in → **Continúa con Google**. The Android account chooser should appear; no Chrome window should open.
4. Choose an account. Verify Profile displays that account, then close/reopen the app and confirm the session remains.
5. Sign out and repeat. Cancel the chooser: the form should remain usable without an error or navigation. Retry and select another account.
6. Repeat with a Play-installed release, configured with the Play signing SHA-1.

If the chooser fails, first check Android package/SHA-1, Web client ID, Google Play services and consent-screen test users. If account selection works but Supabase rejects it, check the enabled provider, accepted Web client ID and nonce configuration. Never paste or log ID tokens, session tokens or client secrets.

## Verification limits

Automated web tests validate plugin selection, raw/hashed nonce exchange, cancellation and missing-plugin handling. They do not prove device account selection or real Supabase sign-in. This sandbox has no JDK, Android SDK, emulator or connected device, so the Android build and real-device test must be performed with Android Studio.