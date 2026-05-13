# PWA → APK Capacitor + SQLite natif

Transforme une PWA React + Vite + IndexedDB + Service Worker en APK Android
standalone offline-first, décorrelée du navigateur.

---

## Quick Start

```bash
# 1. (one-time) Setup machine
npm run setup:android

# 2. (chaque build)
npm run build:apk

# 3. (tester sur téléphone)
npm run serve:apk
# → Ouvre http://<ip>:8080 dans le navigateur Android
```

---

## Stack cible

| Composant | Avant (PWA) | Après (APK) |
|-----------|-------------|-------------|
| UI | React | React (inchangé) |
| Bundler | Vite | Vite (inchangé) |
| Stockage | IndexedDB | SQLite natif (capacitor-community/sqlite) |
| Offline | Service Worker (Cache API) | Embarqué dans l'APK + SQLite local |
| Installation | Chrome "Ajouter à l'écran" | APK Android |
| Mise à jour | SW lifecycle | APK (nouveau build) |

---

## 1. MIGRATION (one-time par projet)

### 1a. Installer Capacitor + SQLite

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/sqlite
npx cap init MonApp com.monapp.app
npx cap add android
```

### 1b. Remplacer le service de stockage

**`src/services/storage.js`** — interface identique (get/set/delete/clear/keys/entries),
implémentation SQLite avec **une seule connexion réutilisée** (évite l'erreur `Connection already exists`) :

```javascript
import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const sqlite = new SQLiteConnection(CapacitorSQLite)
const DB_NAME = 'expack_db'
const STORE_TABLE = 'storage'
let db = null
let initPromise = null

async function initDB() {
  if (db) return db
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      let conn
      try {
        conn = await sqlite.retrieveConnection(DB_NAME)
      } catch {
        conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
      }
      await conn.open()
      await conn.execute(`CREATE TABLE IF NOT EXISTS ${STORE_TABLE} (key TEXT PRIMARY KEY, value TEXT)`)
      db = conn
      return db
    } catch (e) {
      initPromise = null
      throw e
    }
  })()
  return initPromise
}

export const storage = {
  async get(key, dflt) {
    await initDB()
    const r = await db.query(`SELECT value FROM ${STORE_TABLE} WHERE key=?`, [key])
    return r.values?.length ? JSON.parse(r.values[0].value) : dflt
  },
  async set(key, value) {
    await initDB()
    await db.run(`INSERT OR REPLACE INTO ${STORE_TABLE} (key,value) VALUES(?,?)`, [key, JSON.stringify(value)])
  },
  async delete(key) {
    await initDB()
    await db.run(`DELETE FROM ${STORE_TABLE} WHERE key=?`, [key])
  },
  async clear() {
    await initDB()
    await db.run(`DELETE FROM ${STORE_TABLE}`)
  },
  async keys() {
    await initDB()
    return (await db.query(`SELECT key FROM ${STORE_TABLE}`)).values?.map(r => r.key) ?? []
  },
  async entries() {
    await initDB()
    return (await db.query(`SELECT key,value FROM ${STORE_TABLE}`)).values?.map(r => [r.key, JSON.parse(r.value)]) ?? []
  },
}
```

> Aucun changement dans les hooks, contextes, composants.

### 1c. Supprimer le Service Worker & les dépendances PWA

**Fichiers à supprimer :**
```bash
rm -f public/sw.js
rm -rf src/hooks/useOnlineStatus.js src/hooks/useSWUpdate.js
rm -rf src/components/OfflineIndicator src/components/UpdateNotification
rm -rf dev-dist scripts/generate-icons.js
```

**Fichiers à modifier :**

| Fichier | Action |
|---------|--------|
| `src/main.jsx` | Supprimer `navigator.serviceWorker.register(...)` et `navigator.storage.persist()` |
| `src/App.jsx` | Retirer imports + JSX `<OfflineIndicator/>` + `<UpdateNotification/>` ; supprimer `basename="/xxx"` du `<BrowserRouter>` |
| `vite.config.js` | Supprimer `VitePWA` (import + plugin), changer `base` → `'./'` |
| `index.html` | Supprimer `<meta theme-color>`, `<meta apple-mobile-web-app-*>`, `<link manifest>`, `<style>html,body{background}` |
| `src/hooks/useTheme.js` | Renommer `'pwa-theme'` → `'nomapp-theme'` |
| `src/pages/About/*` | Remplacer "Fonctionnalités PWA" par "Fonctionnalités", "IndexedDB" → "SQLite" |
| `package.json` | Supprimer `vite-plugin-pwa` (devDeps), `sharp` (deps) |

### 1d. Configurer Capacitor

**`capacitor.config.json` :**
```json
{
  "appId": "com.monapp.app",
  "appName": "MonApp",
  "webDir": "dist",
  "server": { "androidScheme": "https" },
  "plugins": {
    "SplashScreen": { "launchShowDuration": 1000, "backgroundColor": "#0f172a" }
  }
}
```

### 1e. Pointer Gradle vers le SDK Android

**`android/local.properties`** — obligatoire si `ANDROID_HOME` n'est pas défini dans l'environnement :
```properties
sdk.dir=/opt/android-sdk
```

**`android/gradle.properties`** — sur aarch64, forcer l'utilisation de l'aapt2 du SDK (évite les copies x86-64 natives dans le cache Gradle qui ne passent pas par box64) :
```properties
android.aapt2FromMavenOverride=/opt/android-sdk/build-tools/34.0.0/aapt2
```

### 1f. Personnaliser les icônes Android

Les icônes de l'APK (lanceur, adaptive icon, notifications) sont dans `android/app/src/main/res/mipmap-*/`.
Pour utiliser l'icône de la PWA source (`public/icons/icon-512x512.png`) :

**1. Générer les icônes :**
```bash
npm run icons:android
```

Le script `scripts/generate-android-icons.js` (utilise `sharp`, déjà présent) redimensionne l'icône source
en toutes les densités Android et écrase les fichiers dans les mipmaps.

**2. Couleurs adaptatives (API 26+) :**
- `values/ic_launcher_background.xml` → couleur de fond (ex: `#0f172a`)
- `drawable/ic_launcher_background.xml` → vector drawable du fond (optionnel si couleur unie)
- `drawable-v24/ic_launcher_foreground.xml` → bitmap référençant `@mipmap/ic_launcher_foreground`

**3. Rebuilder :**
```bash
npm run build:apk
```

> L'icône source doit être un carré PNG ou SVG dans `public/icons/`. Le script
> `generate-android-icons.js` peut être adapté pour d'autres projets en changeant
> le chemin `SRC` et les tailles de sortie.

---

## 2. SETUP MACHINE (one-time par machine)

```bash
npm run setup:android
```

Ce script :
1. Installe JDK 21 si absent
2. Télécharge et installe Android SDK 34 + build-tools
3. Sur architecture ARM (aarch64) : installe **box64** et wrappe tous les binaires x86_64 du SDK
4. Ajoute `JAVA_HOME`, `ANDROID_HOME` dans `~/.bashrc`

### Post-setup manuel (sur aarch64)

Même avec `ANDROID_HOME` dans `~/.bashrc`, Gradle peut ne pas le trouver (selon le shell).
Créer ces deux fichiers **après** l'initialisation Capacitor :

- `android/local.properties` → `sdk.dir=/opt/android-sdk`
- `android/gradle.properties` → ajouter `android.aapt2FromMavenOverride=/opt/android-sdk/build-tools/34.0.0/aapt2`

Voir section **1e** pour le contenu exact.

> **Note aarch64** : Google ne fournit pas de binaires ARM natifs pour `aapt2`,
> `zipalign`, etc. Le script les wrappe automatiquement avec `box64`.
> Sans `aapt2FromMavenOverride`, Gradle extrait ses propres copies x86-64 qui
> contournent box64 et causent `Daemon startup failed`.

---

## 3. BUILD APK (chaque itération)

```bash
npm run build:apk
# ou pour une release signée : npm run release:apk
```

Ce script :
1. Wrapper box64 si ARM (appelle `scripts/wrap-x86_64.sh`)
2. `npm run build` (Vite)
3. `npx cap copy && npx cap sync android`
4. `./gradlew assembleDebug` (ou `assembleRelease`)
5. Copie l'APK à la racine du projet

L'APK est dans `ExPack.apk` (debug) ou `ExPack-release.apk` (release).

---

## 4. TESTER SUR ANDROID

```bash
# Lancer le serveur de téléchargement
npm run serve:apk
```

Le script `scripts/serve-apk.js` (zéro dépendance, Node natif) :
1. Détecte automatiquement l'IP locale de la machine
2. Si l'APK est absent, lance `npm run build:apk` automatiquement
3. Sert une page de download sur `http://<ip>:8080`
4. Affiche toutes les IPs accessibles sur le réseau local

Sur votre téléphone Android (même WiFi) :
1. Ouvrez l'URL affichée dans le terminal
2. Appuyez sur **Télécharger l'APK**
3. Ouvrez le fichier téléchargé → **Installer**

> Si l'installation depuis un navigateur est bloquée :
> activez "Installer depuis des sources inconnues" dans Paramètres Android.

---

> **Note** : Le script `build-apk.sh` cherche automatiquement l'APK produit
> (peu importe le suffixe `-unsigned` ou le nom exact). Si aucun APK n'est trouvé,
> le script s'arrête avec une erreur explicite.

---

## 5. RELEASE SIGNÉE (optionnel)

```bash
# Générer le keystore (une seule fois)
keytool -genkey -v -keystore monapp.keystore -alias monapp \
  -keyalg RSA -keysize 2048 -validity 10000

# Placer + configurer
/bin/mv monapp.keystore android/app/
echo "storePassword=motdepasse
keyPassword=motdepasse
keyAlias=monapp
storeFile=app/monapp.keystore" > android/key.properties

# Builder
npm run release:apk
```

---

## Points de vigilance

| Problème | Solution |
|----------|----------|
| `base` dans Vite | Doit être `'./'` (chemins relatifs WebView) |
| `basename` dans `<BrowserRouter>` | Supprimer (routeur sans préfixe) |
| WebView bloque HTTP | `androidScheme: 'https'` dans `capacitor.config.json` |
| Plugin SQLite en dev | Fonctionne seulement sur appareil/émulateur, pas en dev web |
| `Connection already exists` / `Connection does not exist` / `CloseConnection` | Utiliser `retrieveConnection` avec fallback `createConnection` → pas de `isConnection`/`closeConnection`, pas de race condition ; voir code complet en 1b |
| Splash screen | Configurer `SplashScreen` dans `capacitor.config.json` |
| Icônes Android par défaut | Lancer `npm run icons:android` après `npx cap add android` pour utiliser l'icône PWA |
| aapt2 Daemon startup failed (aarch64) | Ajouter `android.aapt2FromMavenOverride` dans `gradle.properties` (voir 1e) |
| SDK location not found | Créer `android/local.properties` avec `sdk.dir=/opt/android-sdk` |

---

## Scripts fournis

| Script | Usage | Description |
|--------|-------|-------------|
| `scripts/setup-android.sh` | Une fois/machine | JDK 21 + SDK 34 + box64 |
| `scripts/wrap-x86_64.sh` | Auto au build | Wrapper box64 pour binaires x86_64 |
| `scripts/build-apk.sh` | Chaque build | Build web → sync → gradlew → copie APK |
| `scripts/serve-apk.js`  | Test Android   | Serveur HTTP zéro-dep, page de download + SHA256 |
| `scripts/generate-android-icons.js` | Une fois ou après nouvel icône | Génère les mipmaps Android depuis `public/icons/icon-512x512.png` |
