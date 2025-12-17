-- CreateTable
CREATE TABLE "ih" (
    "ih_id" TEXT NOT NULL,
    "ih_name" TEXT NOT NULL,
    "ih_poc_tele" TEXT,

    CONSTRAINT "ih_pkey" PRIMARY KEY ("ih_id")
);

-- CreateTable
CREATE TABLE "item" (
    "item_id" SERIAL NOT NULL,
    "nusc_sn" TEXT NOT NULL,
    "item_desc" TEXT NOT NULL,
    "item_sloc" TEXT NOT NULL,
    "item_ih" TEXT NOT NULL,
    "item_qty" INTEGER NOT NULL,
    "item_uom" TEXT NOT NULL,
    "item_purchase_date" TIMESTAMP(3),
    "item_rfp_number" TEXT,
    "item_image" TEXT,
    "item_remarks" TEXT,

    CONSTRAINT "item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "loan_item_detail" (
    "loan_detail_id" SERIAL NOT NULL,
    "ref_no" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "loan_qty" INTEGER NOT NULL,
    "loan_status" TEXT NOT NULL,
    "item_sloc_at_loan" TEXT,
    "item_ih_at_loan" TEXT,

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
    "request_status" TEXT NOT NULL,

    CONSTRAINT "loan_request_pkey" PRIMARY KEY ("ref_no")
);

-- CreateTable
CREATE TABLE "loggies" (
    "loggie_id" SERIAL NOT NULL,
    "loggie_name" TEXT NOT NULL,
    "loggie_tele" TEXT,
    "loggie_nusnet" TEXT NOT NULL,

    CONSTRAINT "loggies_pkey" PRIMARY KEY ("loggie_id")
);

-- CreateTable
CREATE TABLE "requester" (
    "req_id" SERIAL NOT NULL,
    "req_name" TEXT NOT NULL,
    "req_telehandle" TEXT,
    "req_nusnet" TEXT NOT NULL,

    CONSTRAINT "requester_pkey" PRIMARY KEY ("req_id")
);

-- CreateTable
CREATE TABLE "sloc" (
    "sloc_id" TEXT NOT NULL,
    "sloc_name" TEXT NOT NULL,

    CONSTRAINT "sloc_pkey" PRIMARY KEY ("sloc_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_nusc_sn_key" ON "item"("nusc_sn");

-- CreateIndex
CREATE UNIQUE INDEX "loggies_loggie_nusnet_key" ON "loggies"("loggie_nusnet");

-- CreateIndex
CREATE UNIQUE INDEX "requester_req_nusnet_key" ON "requester"("req_nusnet");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_item_sloc_fkey" FOREIGN KEY ("item_sloc") REFERENCES "sloc"("sloc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_item_ih_fkey" FOREIGN KEY ("item_ih") REFERENCES "ih"("ih_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_ref_no_fkey" FOREIGN KEY ("ref_no") REFERENCES "loan_request"("ref_no") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_item_sloc_at_loan_fkey" FOREIGN KEY ("item_sloc_at_loan") REFERENCES "sloc"("sloc_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_item_detail" ADD CONSTRAINT "loan_item_detail_item_ih_at_loan_fkey" FOREIGN KEY ("item_ih_at_loan") REFERENCES "ih"("ih_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_req_id_fkey" FOREIGN KEY ("req_id") REFERENCES "requester"("req_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_loggie_id_fkey" FOREIGN KEY ("loggie_id") REFERENCES "loggies"("loggie_id") ON DELETE CASCADE ON UPDATE CASCADE;
