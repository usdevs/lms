-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'IH', 'LOGS', 'ADMIN');

-- CreateEnum
CREATE TYPE "IHType" AS ENUM ('INDIVIDUAL', 'GROUP', 'DEPARTMENT');

-- AlterTable
ALTER TABLE "ih" ADD COLUMN     "ih_type" "IHType" NOT NULL DEFAULT 'INDIVIDUAL';

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "photo_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REQUESTER',
    "nusnet_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ih_member" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ih_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ih_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_id_key" ON "user"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_nusnet_id_key" ON "user"("nusnet_id");

-- CreateIndex
CREATE UNIQUE INDEX "ih_member_user_id_ih_id_key" ON "ih_member"("user_id", "ih_id");

-- AddForeignKey
ALTER TABLE "ih_member" ADD CONSTRAINT "ih_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ih_member" ADD CONSTRAINT "ih_member_ih_id_fkey" FOREIGN KEY ("ih_id") REFERENCES "ih"("ih_id") ON DELETE CASCADE ON UPDATE CASCADE;
