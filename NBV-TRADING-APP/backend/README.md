# Backend Architecture

The backend is powered by a high-throughput Express.js and WebSocket engine located in `server.ts`.

### Features:
- **Authentication**: JWT token issuance and cookie verification.
- **Profit Cron**: Automatic 24-hour cycle calculator that credits daily returns to eligible active investments.
- **Financial APIs**: Deposit submissions, withdrawal requests, transaction logging.
- **Document Store**: Permanent SECP & FBR registration storage and verification endpoints.
- **WebSocket Gateway**: Real-time push updates for account balance, transaction status, and customer support chat.
