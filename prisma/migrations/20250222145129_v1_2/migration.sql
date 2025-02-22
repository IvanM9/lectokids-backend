-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "hashed_refresh_token" TEXT,
ALTER COLUMN "expires_date" DROP NOT NULL;
