/*
  Warnings:

  - The values [DEPARTMENT] on the enum `IHType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IHType_new" AS ENUM ('INDIVIDUAL', 'GROUP');
ALTER TABLE "public"."ih" ALTER COLUMN "ih_type" DROP DEFAULT;
ALTER TABLE "ih" ALTER COLUMN "ih_type" TYPE "IHType_new" USING ("ih_type"::text::"IHType_new");
ALTER TYPE "IHType" RENAME TO "IHType_old";
ALTER TYPE "IHType_new" RENAME TO "IHType";
DROP TYPE "public"."IHType_old";
ALTER TABLE "ih" ALTER COLUMN "ih_type" SET DEFAULT 'INDIVIDUAL';
COMMIT;
