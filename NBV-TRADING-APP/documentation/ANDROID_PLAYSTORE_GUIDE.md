# Comprehensive Guide: Building Android APK & Publishing to Google Play Store

This guide explains how to convert the **NBV Trading App** into a native Android APK (for direct download) and an Android App Bundle (.aab) for publishing on the **Google Play Store**.

---

## Method 1: Using Capacitor (Recommended for Native APK & Play Store)

Capacitor by Ionic wraps web applications into a native Android project with access to native APIs, high performance, and full Play Store compatibility.

### Step 1: Install Capacitor in the Project
From the project root:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "NBV Trading App" "com.nbvtrading.app" --web-dir dist
```

### Step 2: Build Web Assets and Add Android Platform
```bash
npm run build
npx cap add android
```
This generates a full Android Studio project inside `/android`.

### Step 3: Configure App Icons and Splash Screen
1. Place the official 512x512 logo at `/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`.
2. Generate all standard mipmap sizes (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) using Android Studio's **Asset Studio** (Right-click `res` -> `New` -> `Image Asset`).
3. Set the background color to `#062d1b` (NBV Emerald Green).

### Step 4: Configure Android Permissions
Open `/android/app/src/main/AndroidManifest.xml` and ensure standard internet permissions are present:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Step 5: Build Debug APK for Testing
```bash
cd android
./gradlew assembleDebug
```
The installable APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`
You can transfer this directly to any Android phone and install it immediately!

### Step 6: Generate Release Keystore for Google Play
Generate an official cryptographic signing key:
```bash
keytool -genkey -v -keystore nbv-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias nbvtrading
```
*Note: Keep this keystore and its passwords safe. You will need the same key for all future app updates.*

### Step 7: Build Android App Bundle (.aab) for Google Play Store
In `android/app/build.gradle`, configure signing:
```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file("nbv-release-key.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "nbvtrading"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```
Run the bundle task:
```bash
cd android
./gradlew bundleRelease
```
The output file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## Method 2: Using Bubblewrap (Trusted Web Activity - TWA)

Google's official CLI for turning PWAs into Play Store apps:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DOMAIN.com/manifest.json
bubblewrap build
```
This automatically produces a signed `app-release-signed.aab` ready for Play Console upload.

---

## Google Play Console Checklist

1. **Create Developer Account**: Register at [play.google.com/console](https://play.google.com/console) ($25 one-time fee).
2. **Create New App**: Set Title to "NBV Trading App", Language to English / Urdu, Type to "App", Category to "Finance".
3. **Store Listing Details**:
   - Short description: "Official NBV Trading Platform - Secure Investments, Daily Profits & Team Referral Network."
   - Full description: Highlight SECP registration (CUIN: 886105), daily 24h profit cycles, instant EasyPaisa & JazzCash support.
   - Graphics: Upload 512x512 app icon (`public/nbv-official-logo.png`), 1024x500 feature graphic, and phone screenshots.
4. **App Content Questionnaire**:
   - Privacy Policy URL: Provide your live URL with privacy policy.
   - Target Age: 18 and older.
   - Financial features: Trading & Investment platform.
5. **Upload Bundle**: In "Production" or "Closed Testing", upload `app-release.aab`.
6. **Submit for Review**: Google typically reviews and approves financial apps within 2 to 5 business days.
