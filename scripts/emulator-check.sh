#!/bin/bash

# Check emulator setup for Android or iOS

PLATFORM="${1:-android}"

if [ "$PLATFORM" = "android" ]; then
  echo "Checking Android emulator setup..."
  
  # Check if Android SDK is installed
  if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Library/Android/sdk" ]; then
      export ANDROID_HOME="$HOME/Library/Android/sdk"
    elif [ -d "$HOME/Android/Sdk" ]; then
      export ANDROID_HOME="$HOME/Android/Sdk"
    else
      echo "Android SDK not found"
      echo "Please install Android Studio from https://developer.android.com/studio"
      exit 1
    fi
  fi
  
  EMULATOR_PATH="$ANDROID_HOME/emulator/emulator"
  ADB_PATH="$ANDROID_HOME/platform-tools/adb"
  
  if [ ! -f "$EMULATOR_PATH" ] || [ ! -f "$ADB_PATH" ]; then
    echo "Android emulator or ADB not found"
    echo "Please install Android SDK Platform Tools in Android Studio"
    exit 1
  fi
  
  echo "Android SDK found at: $ANDROID_HOME"
  echo ""
  echo "Available Android Virtual Devices:"
  "$EMULATOR_PATH" -list-avds
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "Android emulator is ready!"
  else
    echo ""
    echo "No AVDs found. Create one in Android Studio: Tools → Device Manager → Create Device"
  fi

elif [ "$PLATFORM" = "ios" ]; then
  echo "Checking iOS Simulator setup..."
  
  if ! command -v xcodebuild &> /dev/null; then
    echo "Xcode not found"
    echo "Please install Xcode from the Mac App Store"
    exit 1
  fi
  
  if ! command -v xcrun simctl &> /dev/null; then
    echo "Simulator command line tools not found"
    echo "Run: xcode-select --install"
    exit 1
  fi
  
  XCODE_VERSION=$(xcodebuild -version 2>&1 | head -n 1)
  echo "$XCODE_VERSION found"
  echo ""
  echo "Available iOS Simulators:"
  xcrun simctl list devices available | grep -E "iPhone|iPad" | head -20
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "iOS Simulator is ready!"
  else
    echo ""
    echo "No simulators found. Install them in Xcode: Xcode → Settings → Platforms"
  fi

else
  echo "Usage: $0 [android|ios]"
  echo "  android - Check Android emulator setup"
  echo "  ios     - Check iOS simulator setup"
  exit 1
fi

