-- CreateEnum
CREATE TYPE "GiftPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "GiftItem" ADD COLUMN     "priority" "GiftPriority" NOT NULL DEFAULT 'MEDIUM';
