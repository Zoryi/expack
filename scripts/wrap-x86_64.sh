#!/bin/bash
set -euo pipefail

ARCH=$(uname -m)
if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
  echo "Native x86_64, no wrapping needed"
  exit 0
fi

which box64 >/dev/null 2>&1 || { echo "Installing box64..."; apt-get install -y -qq box64; }

WRAP() {
  local file="$1"
  if [ -f "$file" ] && [ ! -f "$file.orig" ]; then
    /bin/mv "$file" "$file.orig"
    printf '#!/bin/bash\nexec /usr/bin/box64 "$0.orig" "$@"\n' > "$file"
    chmod +x "$file"
    echo "  wrapped: $file"
  fi
}

SDK=${ANDROID_HOME:-/opt/android-sdk}
echo "Wrapping build-tools..."
for tool in aapt aapt2 zipalign apksigner d8; do
  WRAP "$SDK/build-tools/34.0.0/$tool"
done

echo "Wrapping Gradle cache binaries..."
find ~/.gradle/caches/ -path "*/transformed/*" -type f \( \
  -name "aapt2" -o -name "apksigner" -o -name "d8" -o -name "zipalign" \
\) 2>/dev/null | while read f; do
  WRAP "$f"
done

echo "box64 wrapping complete"
