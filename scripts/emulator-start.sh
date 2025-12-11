#!/bin/bash

# Start Android or iOS emulator

PLATFORM="${1:-android}"

if [ "$PLATFORM" = "android" ]; then
  # Set Android SDK path if not set
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
  
  if [ ! -f "$EMULATOR_PATH" ]; then
    echo "Android emulator not found"
    echo "Please install Android SDK Platform Tools in Android Studio"
    exit 1
  fi
  
  # List available AVDs
  AVDS=$("$EMULATOR_PATH" -list-avds)
  
  if [ -z "$AVDS" ]; then
    echo "No AVDs found"
    echo "Create one in Android Studio: Tools → Device Manager → Create Device"
    exit 1
  fi
  
  # Start ADB server first
  ADB_PATH="$ANDROID_HOME/platform-tools/adb"
  if [ -f "$ADB_PATH" ]; then
    echo "Starting ADB server..."
    "$ADB_PATH" kill-server >/dev/null 2>&1
    "$ADB_PATH" start-server >/dev/null 2>&1
  fi
  
  # Get AVD name (use first one if not specified)
  AVD_NAME="${2:-$(echo "$AVDS" | head -n 1)}"
  echo "Starting Android emulator: $AVD_NAME"
  "$EMULATOR_PATH" -avd "$AVD_NAME" >/dev/null 2>&1 &
  EMULATOR_PID=$!
  echo "Android emulator is starting (PID: $EMULATOR_PID)..."
  
  # Wait for emulator to boot and be detected by ADB
  echo "Waiting for emulator to boot and connect..."
  MAX_WAIT=120
  WAIT_COUNT=0
  DEVICE_CONNECTED=false
  
  while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
    
    if [ -f "$ADB_PATH" ]; then
      DEVICE_STATUS=$("$ADB_PATH" devices 2>/dev/null | grep -E "emulator-[0-9]+" | awk '{print $2}')
      if [ "$DEVICE_STATUS" = "device" ]; then
        DEVICE_CONNECTED=true
        break
      fi
    fi
    
    # Show progress every 10 seconds
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
      echo "Still waiting... ($WAIT_COUNT/$MAX_WAIT seconds)"
    fi
  done
  
  if [ "$DEVICE_CONNECTED" = true ]; then
    DEVICE_ID=$("$ADB_PATH" devices 2>/dev/null | grep -E "emulator-[0-9]+" | awk '{print $1}')
    echo "Emulator is ready! Device: $DEVICE_ID"
  else
    echo "Warning: Emulator started but may not be fully connected yet"
    echo "You can check status with: adb devices"
  fi

elif [ "$PLATFORM" = "ios" ]; then
  if ! command -v xcrun simctl &> /dev/null; then
    echo "iOS Simulator not available"
    echo "Please install Xcode from the Mac App Store"
    exit 1
  fi
  
  if [ ! -d "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" ]; then
    echo "Simulator app not found"
    echo "Please install Xcode completely"
    exit 1
  fi
  
  # Get device type (default to iPhone 15)
  DEVICE_TYPE="${2:-iPhone 15}"
  echo "Starting iOS Simulator: $DEVICE_TYPE"
  
  # Boot the simulator
  xcrun simctl boot "$DEVICE_TYPE" 2>/dev/null || {
    echo "Device '$DEVICE_TYPE' not found, opening default simulator..."
    open -a Simulator
    exit 0
  }
  
  open -a Simulator
  echo "iOS Simulator is starting..."
  echo "Wait for it to fully boot before running the app"

else
  echo "Usage: $0 [android|ios] [device_name]"
  echo "  android [avd_name] - Start Android emulator (uses first AVD if not specified)"
  echo "  ios [device_name]   - Start iOS simulator (default: iPhone 15)"
  exit 1
fi

