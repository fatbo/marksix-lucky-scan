# Mark Six Lucky Scan 🎰 六合彩幸運掃描

A privacy-focused, client-side-only web application for checking Hong Kong Mark Six (六合彩) lottery tickets. All processing happens entirely in your browser — no data is ever sent to any server.

![Home Page](https://github.com/user-attachments/assets/dbc3975b-8197-4b55-a68b-df6f1089c287)

## Features

- **OCR Ticket Scanning** — Upload a ticket image (JPEG/PNG) and extract data using Tesseract.js
- **Editable Fields** — Correct OCR mistakes for draw number, selected numbers, units, and amount
- **Local Storage** — All records saved in IndexedDB using Dexie.js (never leaves your browser)
- **History Management** — View, edit, delete, export (JSON), and import records
- **Draw Result Checking** — Fetch official results and compare your numbers
- **Prize Calculation** — Automatic detection of prize tiers (1st through 7th)
- **Multi-language** — English + Traditional Chinese (繁體中文)
- **Dark Mode** — Toggle between light and dark themes
- **PWA** — Installable, works offline for viewing history
- **Mobile-First** — Responsive design optimized for phone use

## Tech Stack

- **Framework:** React 18+ with Vite
- **Language:** TypeScript
- **UI:** MUI (Material-UI) v5+
- **OCR:** Tesseract.js
- **Storage:** Dexie.js (IndexedDB)
- **State:** Zustand
- **Routing:** React Router
- **i18n:** i18next + react-i18next
- **PWA:** vite-plugin-pwa

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run preview` | Preview production build |

## Disclaimer

This app is unofficial and not affiliated with the Hong Kong Jockey Club (HKJC). Always verify results on the [official HKJC website](https://bet.hkjc.com/marksix/results.aspx?lang=en).
