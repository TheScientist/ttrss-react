# Tiny Tiny RSS React

A modern, responsive, and feature-rich client for Tiny Tiny RSS (tt-RSS), built with React, TypeScript, and Material-UI.
This project was initially completely written by AI using the Windsurf IDE.

## Key Features

- **Responsive Design**: A clean and intuitive interface that works on both desktop and mobile devices.
- **Swipeable Actions**: Easily mark articles as read or starred with a simple swipe on touch devices.
- **Keyboard Shortcuts**: Navigate and manage articles with Vi-like hotkeys (j/n next, k/p prev, s star, u unread, o open, m mark all, ? help).
- **Localization**: Available in English and German, with support for more languages.
- **Separate Dark/Light Builds**: Independent optimized builds for dark and light themes.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm
- A running instance of Tiny Tiny RSS

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/ttrss-react.git
    cd ttrss-react
    ```

2.  Install the dependencies:
    ```sh
    npm install
    ```

3.  Configure your TTRSS instance by navigating to the settings page in the application.

## Keyboard Shortcuts

Press `?` anytime to view the hotkey reference. Available shortcuts:

### Navigation
- **j** or **n**: Next article
- **k** or **p**: Previous article

### Article Actions (when article is selected)
- **s**: Toggle starred
- **u**: Toggle unread
- **o**: Open in new tab
- **m**: Mark all as read (shows confirmation dialog)
- **c**: Close article

### Help
- **?**: Show hotkey reference

## Building and Deployment

### Build Output Structure

Running `npm run build` generates two separate, optimized builds:

```
dist-dark/
├── index-dark.html
├── assets/
├── locales/
└── [theme assets]

dist-light/
├── index-light.html
├── assets/
├── locales/
└── [theme assets]
```

Each build is completely independent with:
- Pre-configured theme (no runtime detection)
- Localized strings (en, de)
- All required assets and manifests

### Deployment with Runtime Configuration

Both builds share a **single configuration approach** via `config.json`. This allows you to deploy the exact same build artifacts at different base paths:

#### Setup

1. **Download artifacts** from GitHub Releases (dist-dark.tar.gz and dist-light.tar.gz)
2. **Extract to your web server**:
   ```
   /var/www/myapp/
   ├── index-dark.html
   ├── config.json          (with basePath: "/")
   ├── assets/
   ├── locales/
   └── light/
       ├── index-light.html
       ├── config.json      (with basePath: "/light/")
       ├── assets/
       └── locales/
   ```

3. **Create config.json files**:
   - At root `/`: 
     ```json
     {
       "basePath": "/"
     }
     ```
   - At `/light/`:
     ```json
     {
       "basePath": "/light/"
     }
     ```

## Available Scripts

In the project directory, you can run:

### Development
- `npm run dev`: Runs the dark theme in development mode (default).
- `npm run dev:dark`: Runs the dark theme in development mode.
- `npm run dev:light`: Runs the light theme in development mode.

### Production
- `npm run build`: Builds both dark and light variants for production.
  - Creates `dist-dark/` with dark theme (at root `/`)
  - Creates `dist-light/` with light theme (at `/light/` subdirectory)
- `npm run build:dark`: Builds only the dark theme variant.
- `npm run build:light`: Builds only the light theme variant.

### Other
- `npm run lint`: Lints the codebase using ESLint.
- `npm run preview`: Serves the dark theme production build locally.
- `npm run generate:icons <source-image> [output-dir]`: Generates PWA icons and favicons from a single source image.
  - Example: `npm run generate:icons icon.png public`
  - Requires: A PNG image (512x512px recommended) with transparent background
  - Generates: App icons, maskable icons for Android, Apple touch icon, and favicon files

## Technologies Used

- **Framework**: React 19
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **Build Tool**: Vite
- **Routing**: React Router
- **Internationalization**: i18next
- **Swipe Gestures**: react-swipeable

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
