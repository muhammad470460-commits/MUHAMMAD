# NBV TRADING APP - REST API Specification

Base URL: `https://YOUR-DOMAIN.com`

---

## Authentication Endpoints

### 1. Register User
`POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "phone": "03001234567",
    "name": "Muhammad Ali",
    "password": "SecretPassword123",
    "referralCode": "NBV786"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "user": { ... },
    "token": "jwt_token_string"
  }
  ```

### 2. Login
`POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "phone": "03001234567",
    "password": "SecretPassword123"
  }
  ```
- **Response**: `200 OK`

### 3. Get Current User Profile
`GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` returns authenticated user entity with balances.

---

## Financial & Profit Endpoints

### 4. Fetch Investment Plans
`GET /api/plans`
- **Response**: `200 OK` array of available VIP plans.

### 5. Submit Deposit Request
`POST /api/deposits/submit`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "planId": "p1",
    "amount": 980,
    "paymentMethod": "EasyPaisa",
    "senderAccountTitle": "Ali Khan",
    "senderAccountNumber": "03123456789",
    "transactionId": "TID9988776655",
    "receiptUrl": "/data/uploads/receipt.png"
  }
  ```

### 6. Synchronize Daily Profit
`POST /api/profit/sync`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Evaluates user active investments. If 24 hours have elapsed since the last payout, automatically calculates profit, credits balance, and resets timer.

### 7. Submit Withdrawal Request
`POST /api/withdrawals/submit`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "amount": 1000,
    "accountType": "JazzCash",
    "accountTitle": "Muhammad Ali",
    "accountNumber": "03001234567",
    "bankName": ""
  }
  ```

---

## Compliance & Documents

### 8. Get Legal Documents
`GET /api/documents`
- **Response**: `200 OK`
  ```json
  {
    "secp": {
      "title": "SECP Certificate of Incorporation",
      "company": "NBV TRADING (SMC-PRIVATE) LIMITED",
      "cuin": "886105",
      "imageUrl": "/assets/secp-certificate-nbv.png"
    },
    "fbr": {
      "title": "FBR Tax Registration Certificate",
      "status": "Verified"
    }
  }
  ```
