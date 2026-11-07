# Frontend Architecture

This folder contains the complete client-side application built with:
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Iconography**: Lucide React
- **Entry Points**: `main.tsx` -> `App.tsx`

### Key Modules:
- `App.tsx`: Central state container, session management, view switching, modal controllers.
- `types.ts`: Strongly typed definitions for Users, Investment Plans, Transactions, Deposits, Withdrawals, and Legal Documents.
- `utils/publicUrl.ts`: Canonical host detector ensuring invite links always generate valid public HTTPS URLs.
- `utils/authSession.ts`: Secure local storage and memory management for user authentication tokens.
- `hooks/usePWAInstall.ts`: Android beforeinstallprompt event interceptor for custom in-app install buttons.
