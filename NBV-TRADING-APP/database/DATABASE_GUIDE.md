# NBV TRADING APP - Database Architecture & Maintenance Guide

## Overview
The NBV Trading App utilizes a high-performance transactional JSON datastore (with automatic write-ahead durability) designed for instant zero-latency query response, seamless containerization, and effortless portability. It can be directly transitioned to PostgreSQL, MySQL, or Cloud SQL using the relational schema provided below.

## Collections / Tables

### 1. 
- uid=0(root) gid=0(root) groups=0(root) (string, UUID / Primary Key)
-  (string, unique 11-digit Pakistan mobile format e.g. 03001234567)
-  (string, user full name)
-  (string, secure hash)
-  (enum: 'user' | 'admin')
-  (string, unique 6-8 character alphanumeric code e.g. NBV786)
-  (string, referral code of parent sponsor or null)
-  (number, withdrawable balance in PKR)
-  (number, active principal in PKR)
-  (number, expected 24h profit in PKR)
-  (number, cumulative profit credited)
-  (ISO timestamp of next 24h profit settlement)
-  (object: bankName, accountTitle, accountNumber)
-  (ISO timestamp)
-  (enum: 'active' | 'suspended' | 'pending')

### 2. 
- uid=0(root) gid=0(root) groups=0(root) (string, plan identifier e.g. 'vip-1', 'vip-2')
-  (string e.g. 'VIP Plan 1 - Bronze')
-  (number, min investment in PKR)
-  (number, max investment in PKR)
-  (number, fixed or percentage daily return)
-  (number, contract tenure e.g. 30, 60, 90 days)
-  (string, visual theme hex)
-  (string e.g. 'Popular', 'Hot', 'VIP')
-  (enum: 'active' | 'archived')

### 3. 
- uid=0(root) gid=0(root) groups=0(root) (string, UUID)
-  (string, foreign key to users.id)
-  (string, foreign key to investment_plans.id)
-  (number, principal invested)
-  (number, scheduled daily return)
-  (ISO timestamp)
-  (ISO timestamp)
-  (ISO timestamp)
-  (enum: 'active' | 'completed' | 'cancelled')

### 4. 
- uid=0(root) gid=0(root) groups=0(root) (string, UUID)
-  (string, foreign key to users.id)
-  (string, target investment plan)
-  (number in PKR)
-  (enum: 'JazzCash' | 'EasyPaisa' | 'BankTransfer')
-  (string)
-  (string)
-  (string, sender's bank/wallet TID)
-  (string, uploaded proof of payment)
-  (enum: 'pending' | 'approved' | 'rejected')
-  (ISO timestamp)
-  (ISO timestamp)
-  (string, admin user ID)

### 5. 
- uid=0(root) gid=0(root) groups=0(root) (string, UUID)
-  (string, foreign key to users.id)
-  (number in PKR)
-  (enum: 'JazzCash' | 'EasyPaisa' | 'Bank')
-  (string)
-  (string)
-  (string, optional)
-  (enum: 'pending' | 'processing' | 'approved' | 'rejected')
-  (string, generated disbursement voucher)
-  (ISO timestamp)
-  (ISO timestamp)

### 6. 
- uid=0(root) gid=0(root) groups=0(root) (string e.g. 'secp_registration', 'fbr_certificate')
-  (enum: 'SECP' | 'FBR' | 'TERMS')
-  (string)
-  (string e.g. 'CUIN: 886105')
-  (string: 'NBV TRADING (SMC-PRIVATE) LIMITED')
-  (string, permanent asset path)
-  (enum: 'verified' | 'active')
-  (string)

## Backup & Durability
- Database writes are atomic.
- When migrating to PostgreSQL, use standard Drizzle ORM or Prisma migrations matching the schema definitions.