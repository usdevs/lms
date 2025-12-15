import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('Clearing existing data...');
  await prisma.loanItemDetail.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.item.deleteMany();
  await prisma.requester.deleteMany();
  await prisma.loggies.deleteMany();
  await prisma.sloc.deleteMany();
  await prisma.iH.deleteMany();

  // 1. Create Sloc (Storage Locations)
  console.log('Creating storage locations...');
  const sloc1 = await prisma.sloc.create({
    data: {
      slocId: 'SLOC001',
      slocName: 'Main Warehouse',
    },
  });
  const sloc2 = await prisma.sloc.create({
    data: {
      slocId: 'SLOC002',
      slocName: 'Secondary Storage',
    },
  });
  const sloc3 = await prisma.sloc.create({
    data: {
      slocId: 'SLOC003',
      slocName: 'Equipment Room',
    },
  });

  // 2. Create IH (Inventory Holders)
  console.log('Creating inventory holders...');
  const ih1 = await prisma.iH.create({
    data: {
      ihId: 'IH001',
      ihName: 'John Doe',
      ihPocTele: '@johndoe',
    },
  });
  const ih2 = await prisma.iH.create({
    data: {
      ihId: 'IH002',
      ihName: 'Jane Smith',
      ihPocTele: '@janesmith',
    },
  });
  const ih3 = await prisma.iH.create({
    data: {
      ihId: 'IH003',
      ihName: 'Bob Johnson',
      ihPocTele: '@bobjohnson',
    },
  });

  // 3. Create Requesters
  console.log('Creating requesters...');
  const requester1 = await prisma.requester.create({
    data: {
      reqName: 'Alice Williams',
      reqTelehandle: '@alicew',
      reqNusnet: 'e1234567',
    },
  });
  const requester2 = await prisma.requester.create({
    data: {
      reqName: 'Charlie Brown',
      reqTelehandle: '@charlieb',
      reqNusnet: 'e2345678',
    },
  });
  const requester3 = await prisma.requester.create({
    data: {
      reqName: 'Diana Prince',
      reqTelehandle: '@dianap',
      reqNusnet: 'e3456789',
    },
  });

  // 4. Create Loggies
  console.log('Creating loggies...');
  const loggie1 = await prisma.loggies.create({
    data: {
      loggieName: 'Mike Taylor',
      loggieTele: '@miket',
      loggieNusnet: 'e4567890',
    },
  });
  const loggie2 = await prisma.loggies.create({
    data: {
      loggieName: 'Sarah Connor',
      loggieTele: '@sarahc',
      loggieNusnet: 'e5678901',
    },
  });

  // 5. Create Items
  console.log('Creating items...');
  const item1 = await prisma.item.create({
    data: {
      nuscSn: 'ITEM001',
      itemDesc: 'Laptop Computer',
      itemSloc: sloc1.slocId,
      itemIh: ih1.ihId,
      itemQty: 5,
      itemUom: 'units',
      itemPurchaseDate: new Date('2024-01-15'),
      itemRfpNumber: 'RFP-2024-001',
      itemRemarks: 'Dell Latitude laptops',
    },
  });
  const item2 = await prisma.item.create({
    data: {
      nuscSn: 'ITEM002',
      itemDesc: 'Projector',
      itemSloc: sloc1.slocId,
      itemIh: ih1.ihId,
      itemQty: 3,
      itemUom: 'units',
      itemPurchaseDate: new Date('2024-02-20'),
      itemRfpNumber: 'RFP-2024-002',
    },
  });
  const item3 = await prisma.item.create({
    data: {
      nuscSn: 'ITEM003',
      itemDesc: 'Microphone Set',
      itemSloc: sloc2.slocId,
      itemIh: ih2.ihId,
      itemQty: 10,
      itemUom: 'sets',
      itemPurchaseDate: new Date('2024-03-10'),
      itemRemarks: 'Wireless microphones',
    },
  });
  const item4 = await prisma.item.create({
    data: {
      nuscSn: 'ITEM004',
      itemDesc: 'Sound System',
      itemSloc: sloc3.slocId,
      itemIh: ih3.ihId,
      itemQty: 2,
      itemUom: 'units',
      itemPurchaseDate: new Date('2024-04-05'),
      itemRfpNumber: 'RFP-2024-003',
    },
  });
  const item5 = await prisma.item.create({
    data: {
      nuscSn: 'ITEM005',
      itemDesc: 'Table',
      itemSloc: sloc2.slocId,
      itemIh: ih2.ihId,
      itemQty: 20,
      itemUom: 'units',
      itemPurchaseDate: new Date('2024-05-12'),
    },
  });

  // 6. Create Loan Requests
  console.log('Creating loan requests...');
  const loanRequest1 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2024-12-20'),
      loanDateEnd: new Date('2024-12-22'),
      reqId: requester1.reqId,
      loggieId: loggie1.loggieId,
      organisation: 'NUS Computing Club',
      eventDetails: 'Annual Tech Conference',
      eventLocation: 'LT27',
      requestStatus: 'approved',
    },
  });
  const loanRequest2 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2024-12-25'),
      loanDateEnd: new Date('2024-12-27'),
      reqId: requester2.reqId,
      loggieId: loggie2.loggieId,
      organisation: 'NUS Engineering Society',
      eventDetails: 'Workshop Series',
      eventLocation: 'Engineering Auditorium',
      requestStatus: 'pending',
    },
  });
  const loanRequest3 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2025-01-05'),
      loanDateEnd: new Date('2025-01-07'),
      reqId: requester3.reqId,
      organisation: 'NUS Student Union',
      eventDetails: 'Orientation Camp',
      eventLocation: 'UTown',
      requestStatus: 'approved',
    },
  });

  // 7. Create Loan Item Details
  console.log('Creating loan item details...');
  await prisma.loanItemDetail.create({
    data: {
      refNo: loanRequest1.refNo,
      itemId: item1.itemId,
      loanQty: 2,
      loanStatus: 'loaned',
      itemSlocAtLoan: sloc1.slocId,
      itemIhAtLoan: ih1.ihId,
    },
  });
  await prisma.loanItemDetail.create({
    data: {
      refNo: loanRequest1.refNo,
      itemId: item2.itemId,
      loanQty: 1,
      loanStatus: 'loaned',
      itemSlocAtLoan: sloc1.slocId,
      itemIhAtLoan: ih1.ihId,
    },
  });
  await prisma.loanItemDetail.create({
    data: {
      refNo: loanRequest2.refNo,
      itemId: item3.itemId,
      loanQty: 5,
      loanStatus: 'pending',
      itemSlocAtLoan: sloc2.slocId,
      itemIhAtLoan: ih2.ihId,
    },
  });
  await prisma.loanItemDetail.create({
    data: {
      refNo: loanRequest2.refNo,
      itemId: item4.itemId,
      loanQty: 1,
      loanStatus: 'pending',
      itemSlocAtLoan: sloc3.slocId,
      itemIhAtLoan: ih3.ihId,
    },
  });
  await prisma.loanItemDetail.create({
    data: {
      refNo: loanRequest3.refNo,
      itemId: item5.itemId,
      loanQty: 10,
      loanStatus: 'approved',
      itemSlocAtLoan: sloc2.slocId,
      itemIhAtLoan: ih2.ihId,
    },
  });

  console.log('Seed completed successfully!');
  console.log('\nSummary:');
  console.log(`   - ${await prisma.sloc.count()} storage locations`);
  console.log(`   - ${await prisma.iH.count()} inventory holders`);
  console.log(`   - ${await prisma.requester.count()} requesters`);
  console.log(`   - ${await prisma.loggies.count()} loggies`);
  console.log(`   - ${await prisma.item.count()} items`);
  console.log(`   - ${await prisma.loanRequest.count()} loan requests`);
  console.log(`   - ${await prisma.loanItemDetail.count()} loan item details`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

