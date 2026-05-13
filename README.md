# PWA Starter

Template PWA générique — Offline-first, installable sur Android.

## Stack

- **React 19** — UI
- **Vite 8** — Bundler
- **vite-plugin-pwa** — PWA / Service Worker / Manifest
- **react-router-dom 7** — Routing
- **CSS Modules** — Styles isolés
- **ESLint 10** — Linting

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

## Installation sur Android

1. Construisez l'application : `npm run build`
2. Lancez le serveur de preview : `npm run preview`
3. Depuis votre téléphone sur le même réseau, ouvrez `http://<ip-de-votre-machine>:4173`
4. Dans Chrome Android, appuyez sur le menu ⋮ → **Installer l'application**
5. L'icône apparaît dans le tiroir d'applications avec le nom "PWA Starter"

## Fonctionnalités

| Feature | Détail |
|---|---|
| Offline-first | Service Worker + cache stratégique (Workbox) |
| Installation Android | Manifest complet, icônes maskable |
| Mise à jour automatique | Notification lorsqu'une nouvelle version est disponible |
| Thème dark/light | Persistence localStorage, suit le système par défaut |
| Mode standalone | Pas de chrome navigateur, immersion totale |
| Accessibilité | Rôles ARIA, focus visible, contrastes WCAG |
| Error Boundary | Capture les erreurs React sans casser l'app |

## Structure

```
src/
├── components/    # Composants UI réutilisables
├── hooks/         # Logique métier isolée
├── pages/         # Pages de l'application
├── styles/        # CSS global (variables, reset, animations)
├── App.jsx        # Root component avec Router
└── main.jsx       # Point d'entrée
```

## Personnalisation

Éditez `vite.config.js` pour modifier :
- Le nom de l'application (champs `name`, `short_name`, `description`)
- Les couleurs du thème (`theme_color`, `background_color`)
- Les stratégies de cache Workbox

Remplacez les icônes dans `public/icons/` par vos propres PNG 192x192 et 512x512.
