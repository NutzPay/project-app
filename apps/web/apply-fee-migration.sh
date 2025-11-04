#!/bin/bash
# Script para aplicar migration de campos de taxa no User
# Execute este script na VM após fazer deploy dos arquivos

echo "🔄 Aplicando migration de campos de taxa..."

# Conectar ao PostgreSQL e executar o SQL
psql $DATABASE_URL << 'EOF'
-- Add fee configuration fields to User table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "monthlyFee" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "transactionFee" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exchangeRateFeePercent" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exchangeRateFeeFixed" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pixPayinFeePercent" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pixPayinFeeFixed" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pixPayoutFeePercent" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pixPayoutFeeFixed" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "manualWithdrawFeePercent" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "manualWithdrawFeeFixed" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "usdtPurchaseFeePercent" DECIMAL(5,4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "usdtPurchaseFeeFixed" DECIMAL(10,2);
EOF

if [ $? -eq 0 ]; then
  echo "✅ Migration aplicada com sucesso!"
else
  echo "❌ Erro ao aplicar migration"
  exit 1
fi

echo "🔄 Gerando Prisma Client..."
cd /var/www/nutzpay
npx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma Client gerado com sucesso!"
else
  echo "❌ Erro ao gerar Prisma Client"
  exit 1
fi

echo "🔄 Reiniciando aplicação..."
pm2 restart nutzpay

echo "✅ Deploy completo!"
