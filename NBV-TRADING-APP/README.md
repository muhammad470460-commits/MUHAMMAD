# NBV TRADING APP - Complete Enterprise Trading System

Welcome to the official repository and project distribution for **NBV TRADING (SMC-PRIVATE) LIMITED**.

NBV Trading App is an automated investment, profit-distribution, and team referral platform built specifically for mobile and desktop web browsers, progressive web app (PWA) installation, and native Android (APK & Google Play Store AAB) deployment.

---

## 🌟 Key Features

1. **Autonomous 24-Hour Profit Settlement Engine**:
   - Automated server-side profit accrual cron.
   - Clean, live-ticking visual countdown clock (Hours, Minutes, Seconds) with real-time settlement sync.
   - Separate principal balance from withdrawable daily returns.

2. **Official Pakistani Legal Compliance**:
   - **SECP Registration**: Registered under Section 16 of the Companies Act, 2017 (CUIN: 886105) as *NBV TRADING (SMC-PRIVATE) LIMITED*.
   - **FBR Compliance**: Federal Board of Revenue registered taxpayer status.
   - In-app document viewer with high-resolution digital certificates and instant verification.

3. **Multi-Channel Pakistani Financial Gateway**:
   - **Deposit Methods**: EasyPaisa, JazzCash, and direct Bank Transfer (Raast-compatible) with payment slip & TID capture.
   - **Instant Withdrawal Engine**: Automated validation and ledger accounting for withdrawals to any Pakistani bank or mobile wallet.
   - **Automated Receipt Generator**: Generates professional transaction vouchers with status badges and timestamps.

4. **Public Referral & Team Management Network**:
   - Every registered user receives a unique referral code and canonical invite link (e.g. `https://domain.com/register?ref=USER123`).
   - 1-tap WhatsApp sharing with localized Urdu & English invitations.
   - Native Android Share Sheet integration via Web Share API.
   - Persistent referral code tracking (retained during browser refresh, navigation, or app reopening).

5. **Master Administration Suite**:
   - Live approval/rejection pipeline for deposits and withdrawals.
   - User account management, balance adjustments, and activity audit.
   - Dynamic VIP plan creation and rate configuration.
   - Official SECP & FBR compliance document manager.

6. **Full Android & Cross-Platform Support**:
   - Responsive mobile-first UI with smooth touch gestures.
   - PWA with offline caching and home screen install banner.
   - Ready for packaging into standalone Android APK and Google Play Store App Bundle (.aab).

---

## 📁 Project Structure

```
/NBV-TRADING-APP
├── frontend/               # React 19 + TypeScript + Tailwind SPA source files
│   ├── hooks/             # PWA and UI state management hooks
│   ├── utils/             # Canonical URL generator, session storage, real-time sync
│   ├── App.tsx            # Root application router and shell
│   ├── main.tsx           # Entry point
│   ├── index.css          # Tailwind CSS design system
│   └── types.ts           # Comprehensive TypeScript interfaces
├── backend/                # Express & WebSocket Node.js server
│   └── server.ts          # RESTful APIs, scheduled cron, auth, and real-time chat
├── components/             # Reusable UI modules
│   ├── DailyProfitCard.tsx           # Live 24h countdown clock & profit sync
│   ├── InvestmentPlansComponent.tsx  # VIP packages & earnings calculator
│   ├── WithdrawalComponent.tsx       # Fast withdrawal requests & bank setup
│   ├── UserModulesModal.tsx          # Team network, history, profile, & support
│   ├── AdminReceiptGenerator.tsx     # Voucher creation & transaction slips
│   ├── NbvVisuals.tsx                # Official gold-and-green shield emblem
│   ├── PWAInstallButton.tsx          # 1-tap Android install prompt
│   └── WelcomeScreen.tsx             # Animated startup branding
├── pages/                  # Top-level screen views
│   ├── DashboardScreen.tsx           # User wallet, profit stats, & quick actions
│   └── AuthScreens.tsx               # Login, referral register, & password recovery
├── admin/                  # Administrative tools
│   └── AdminPanel.tsx                # Master dashboard for operations & audit
├── assets/                 # Brand assets & legal verification documents
│   ├── images/                       # Official high-resolution NBV logo
│   ├── icons/                        # Complete PWA & Android icon set (192, 512, maskable)
│   └── documents/                    # Official SECP & FBR incorporation certificates
├── database/               # Database documentation, relational schema, and seed data
│   ├── schema.json                   # Full data entity specification
│   ├── nbv_db.example.json           # Sanitized seed dataset with VIP plans
│   └── DATABASE_GUIDE.md             # PostgreSQL / MySQL migration guide
├── configuration/          # Build configs and environment templates
│   ├── package.json                  # NPM dependencies & scripts
│   ├── tsconfig.json                 # TypeScript compiler options
│   ├── vite.config.ts                # Vite frontend bundler configuration
│   ├── .env.example                  # Environment variable reference
│   ├── manifest.json                 # Web App Manifest for Android PWA
│   ├── sw.js                         # Offline Service Worker
│   └── index.html                    # HTML entry point with SEO metadata
├── public/                 # Static web root served by Vite and Express
├── documentation/          # Exhaustive technical guides
│   ├── README.md                     # Documentation index
│   ├── ANDROID_PLAYSTORE_GUIDE.md    # Step-by-step APK & Play Store AAB publishing
│   ├── API_DOCS.md                   # RESTful API specifications
│   ├── SECURITY_GUIDE.md             # Secrets management & data security
│   └── DEPLOYMENT_GUIDE.md           # Production server & cloud deployment
└── backup/                 # Project backup manifest & recovery tools
    ├── BACKUP_MANIFEST.json          # Machine-readable inventory & integrity hashes
    └── RESTORE_INSTRUCTIONS.md       # 1-command recovery instructions
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js version 18.0.0 or higher
- npm or bun

### 1. Installation
Clone or extract the project archive:
```bash
cd NBV-TRADING-APP
npm install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp configuration/.env.example .env
```
Edit `.env` to supply your port and configuration details.

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```
