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
