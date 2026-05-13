#!/bin/bash
set -euo pipefail

echo "=== Setup Android SDK + JDK for Capacitor ==="
ARCH=$(uname -m)
echo "[1/6] Architecture: $ARCH"

echo "[2/6] Installing JDK 21..."
apt-get update -qq && apt-get install -y -qq openjdk-21-jdk 2>/dev/null | tail -1
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-$(dpkg --print-architecture)
export JAVA_HOME PATH=$JAVA_HOME/bin:$PATH

echo "[3/6] Installing Android SDK cmdline-tools..."
ANDROID_SDK=/opt/android-sdk; mkdir -p $ANDROID_SDK
if [ ! -f "$ANDROID_SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/clt.zip
  unzip -q /tmp/clt.zip -d /tmp/clt && mkdir -p $ANDROID_SDK/cmdline-tools
  /bin/mv /tmp/clt/cmdline-tools $ANDROID_SDK/cmdline-tools/latest && rm -rf /tmp/clt /tmp/clt.zip
fi
export ANDROID_HOME=$ANDROID_SDK PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH

echo "[4/6] Accepting licenses + installing SDK 34..."
yes | sdkmanager --licenses >/dev/null 2>&1
sdkmanager "platforms;android-34" "build-tools;34.0.0" >/dev/null 2>&1

echo "[5/6] Configuring box64 for ARM64..."
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  apt-get install -y -qq box64
  cd $ANDROID_HOME/build-tools/34.0.0
  for tool in aapt aapt2 zipalign apksigner d8; do
    [ -f "$tool" ] && [ ! -f "$tool.orig" ] && /bin/mv "$tool" "$tool.orig" && \
      printf '#!/bin/bash\nexec /usr/bin/box64 "$0.orig" "$@"\n' > "$tool" && chmod +x "$tool" && echo "  wrapped: $tool"
  done
fi

echo "[6/6] Saving env vars to ~/.bashrc..."
for line in "export JAVA_HOME=$JAVA_HOME" "export ANDROID_HOME=$ANDROID_SDK" \
  'export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH'; do
  grep -q "${line%%=*}" ~/.bashrc 2>/dev/null || echo "$line" >> ~/.bashrc
done

echo "=== Done ==="
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_SDK"
echo ""
echo "Next: npm run build:apk"
