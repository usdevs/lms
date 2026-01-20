-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'IH', 'LOGS', 'ADMIN');

-- CreateEnum
CREATE TYPE "IHType" AS ENUM ('INDIVIDUAL', 'GROUP', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "LoanRequestStatus" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoanItemStatus" AS ENUM ('PENDING', 'ON_LOAN', 'RETURNED', 'RETURNED_LATE', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "telegram_handle" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "ih" (
    "ih_id" TEXT NOT NULL,
    "ih_name" TEXT NOT NULL,
    "ih_type" "IHType" NOT NULL DEFAULT 'INDIVIDUAL',

    CONSTRAINT "ih_pkey" PRIMARY KEY ("ih_id")
);

-- CreateTable
CREATE TABLE "item" (
    "item_id" SERIAL NOT NULL,
    "item_desc" TEXT NOT NULL,
    "item_sloc" TEXT NOT NULL,
    "item_ih" TEXT NOT NULL,
    "item_qty" INTEGER NOT NULL,
    "item_uom" TEXT NOT NULL,
    "item_purchase_date" TIMESTAMP(3),
    "item_rfp_number" TEXT,
    "item_image" TEXT,
    "item_remarks" TEXT,
    "item_unloanable" BOOLEAN NOT NULL DEFAULT false,
    "item_expendable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "loan_item_detail" (
    "loan_detail_id" SERIAL NOT NULL,
    "ref_no" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "loan_qty" INTEGER NOT NULL,
    "loan_status" "LoanItemStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "loan_item_detail_pkey" PRIMARY KEY ("loan_detail_id")
);

-- CreateTable
CREATE TABLE "loan_request" (
    "ref_no" SERIAL NOT NULL,
    "loan_date_start" TIMESTAMP(3) NOT NULL,
    "loan_date_end" TIMESTAMP(3) NOT NULL,
    "req_id" INTEGER NOT NULL,
    "loggie_id" INTEGER,
    "organisation" TEXT,
    "event_details" TEXT,
    "event_location" TEXT,
    "request_status" "LoanRequestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "loan_request_pkey" PRIMARY KEY ("ref_no")
);

-- CreateTable
CREATE TABLE "sloc" (
    "sloc_id" TEXT NOT NULL,
    "sloc_name" TEXT NOT NULL,

    CONSTRAINT "sloc_pkey" PRIMARY KEY ("sloc_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_handle_key" ON "user"("telegram_handle");

-- CreateIndex
CREATE UNIQUE INDEX "user_nusnet_id_key" ON "user"("nusnet_id");

-- CreateIndex
CREATE UNIQUE INDEX "ih_member_user_id_ih_id_key" ON "ih_member"("user_id", "ih_id");

-- AddForeignKey
ALTER TABLE "ih_member" ADD CONSTRAINT "ih_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ih_member" ADD CONSTRAINT "ih_member_ih_id_fkey" FOREIGN KEY ("ih_id") REFERENCES "ih"("ih_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_item_sloc_fkey" FOREIGN KEY ("item_sloc") REFERENCES "sloc"("sloc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_item_ih_fkey" FOREIGN KEY ("item_ih") REFERENCES "ih"("ih_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_ref_no_fkey" FOREIGN KEY ("ref_no") REFERENCES "loan_request"("ref_no") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_req_id_fkey" FOREIGN KEY ("req_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_loggie_id_fkey" FOREIGN KEY ("loggie_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
