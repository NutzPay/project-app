-- CreateEnum
CREATE TYPE "StarkbankEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'STARKBANK_CONFIG_UPDATE';

-- CreateTable
CREATE TABLE "starkbank_configs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "environment" "StarkbankEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "starkbank_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "starkbank_configs_projectId_key" ON "starkbank_configs"("projectId");
