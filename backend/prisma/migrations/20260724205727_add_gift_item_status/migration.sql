-- CreateEnum
CREATE TYPE "GiftItemStatus" AS ENUM ('ACTIVE', 'RECEIVED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "GiftItem" ADD COLUMN     "status" "GiftItemStatus" NOT NULL DEFAULT 'ACTIVE';
