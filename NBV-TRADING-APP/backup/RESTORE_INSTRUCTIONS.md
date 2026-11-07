# Project Restoration Instructions

To restore and run this backup on any computer or server:

### 1. Extract the Archive
```bash
unzip NBV-TRADING-APP-BACKUP.zip -d nbv-project
cd nbv-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Configuration
```bash
cp configuration/.env.example .env
```

### 4. Build and Run
```bash
# Development mode:
npm run dev

# Production build and run:
npm run build
npm start
```
The application will launch on port 3000 (or custom configured port).
