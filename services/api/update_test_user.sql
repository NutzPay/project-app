-- Update felixelmada@gmail.com account for testing
-- Add balances: 50,000 USDT
-- Set user status and verification

-- First, ensure user exists with proper CUID
INSERT INTO users (
  "id",
  "email", 
  "name",
  "password",
  "role",
  "status", 
  "emailVerified",
  "emailVerifiedAt",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cm123456789felix001test001',
  'felixelmada@gmail.com',
  'Felix Elmada (Test)',
  '$2a$12$LQv3c1yqBwlkc1xuU5rXTOgvmvnWvZNvHrn3qU.1B4S4b2BwC5oL2', -- "password123" hashed
  'MEMBER',
  'ACTIVE',
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "name" = 'Felix Elmada (Test)',
  "status" = 'ACTIVE',
  "emailVerified" = true,
  "emailVerifiedAt" = NOW(),
  "updatedAt" = NOW();

-- Create or update USDT wallet with balance
INSERT INTO usdt_wallets (
  "id",
  "userId", 
  "balance",
  "frozenBalance",
  "totalDeposited",
  "totalWithdrawn",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cm123456789wallet001felix001',
  (SELECT id FROM users WHERE email = 'felixelmada@gmail.com'),
  50000.000000, -- 50,000 USDT
  0.000000,
  50000.000000,
  0.000000,
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "balance" = 50000.000000,
  "totalDeposited" = 50000.000000,
  "updatedAt" = NOW();

-- Create a deposit transaction to justify the balance
INSERT INTO usdt_transactions (
  "id",
  "walletId",
  "type",
  "status",
  "amount",
  "balanceAfter",
  "brlAmount",
  "exchangeRate",
  "description",
  "processedAt",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cm123456789txn001felix00001',
  (SELECT id FROM usdt_wallets WHERE "userId" = (SELECT id FROM users WHERE email = 'felixelmada@gmail.com')),
  'DEPOSIT',
  'COMPLETED',
  50000.000000,
  50000.000000,
  270000.00, -- ~R$ 270,000 assuming 5.4 BRL/USDT rate
  5.40,
  'Initial test deposit for felixelmada@gmail.com',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;