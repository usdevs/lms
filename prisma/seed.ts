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
  await prisma.iHMember.deleteMany();
  await prisma.user.deleteMany();
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

  // 2. Create Users (with different roles)
  console.log('Creating users...');

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      telegramId: BigInt(111111111),
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      nusnetId: 'e0000000',
    },
  });

  // Logs users
  const logsUser1 = await prisma.user.create({
    data: {
      telegramId: BigInt(222222221),
      username: 'miket',
      firstName: 'Mike',
      lastName: 'Taylor',
      role: 'LOGS',
      nusnetId: 'e4567890',
    },
  });

  const logsUser2 = await prisma.user.create({
    data: {
      telegramId: BigInt(222222222),
      username: 'sarahc',
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'LOGS',
      nusnetId: 'e5678901',
    },
  });

  // IH users (will be assigned to IHs)
  const ihUser1 = await prisma.user.create({
    data: {
      telegramId: BigInt(333333331),
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'IH',
      nusnetId: 'e1111111',
    },
  });

  const ihUser2 = await prisma.user.create({
    data: {
      telegramId: BigInt(333333332),
      username: 'janesmith',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'IH',
      nusnetId: 'e2222222',
    },
  });

  const ihUser3 = await prisma.user.create({
    data: {
      telegramId: BigInt(333333333),
      username: 'bobjohnson',
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'IH',
      nusnetId: 'e3333333',
    },
  });

  // Additional IH user (for group ownership example)
  const ihUser4 = await prisma.user.create({
    data: {
      telegramId: BigInt(333333334),
      username: 'emilydavis',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'IH',
      nusnetId: 'e4444444',
    },
  });

  // Requester users
  const requesterUser1 = await prisma.user.create({
    data: {
      telegramId: BigInt(444444441),
      username: 'alicew',
      firstName: 'Alice',
      lastName: 'Williams',
      role: 'REQUESTER',
      nusnetId: 'e1234567',
    },
  });

  const requesterUser2 = await prisma.user.create({
    data: {
      telegramId: BigInt(444444442),
      username: 'charlieb',
      firstName: 'Charlie',
      lastName: 'Brown',
      role: 'REQUESTER',
      nusnetId: 'e2345678',
    },
  });

  const requesterUser3 = await prisma.user.create({
    data: {
      telegramId: BigInt(444444443),
      username: 'dianap',
      firstName: 'Diana',
      lastName: 'Prince',
      role: 'REQUESTER',
      nusnetId: 'e3456789',
    },
  });

  // 3. Create IH (Inventory Holders)
  console.log('Creating inventory holders...');
  const ih1 = await prisma.iH.create({
    data: {
      ihId: 'IH001',
      ihName: 'John Doe',
      ihType: 'INDIVIDUAL',
      ihPocTele: '@johndoe', // Deprecated field
    },
  });

  const ih2 = await prisma.iH.create({
    data: {
      ihId: 'IH002',
      ihName: 'Jane Smith',
      ihType: 'INDIVIDUAL',
      ihPocTele: '@janesmith',
    },
  });

  const ih3 = await prisma.iH.create({
    data: {
      ihId: 'IH003',
      ihName: 'Computing Club Logistics',
      ihType: 'GROUP', // Group ownership example
      ihPocTele: '@bobjohnson, @emilydavis',
    },
  });

  // 4. Create IH Memberships (User-IH associations)
  console.log('Creating IH memberships...');

  // John Doe is the only member of IH001
  await prisma.iHMember.create({
    data: {
      userId: ihUser1.userId,
      ihId: ih1.ihId,
      isPrimary: true,
    },
  });

  // Jane Smith is the only member of IH002
  await prisma.iHMember.create({
    data: {
      userId: ihUser2.userId,
      ihId: ih2.ihId,
      isPrimary: true,
    },
  });

  // IH003 (Computing Club Logistics) has 2 POCs: Bob (primary) and Emily (secondary)
  await prisma.iHMember.create({
    data: {
      userId: ihUser3.userId,
      ihId: ih3.ihId,
      isPrimary: true, // Bob is primary POC
    },
  });

  await prisma.iHMember.create({
    data: {
      userId: ihUser4.userId,
      ihId: ih3.ihId,
      isPrimary: false, // Emily is secondary POC
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
  console.log('\n✅ Summary:');
  console.log(`   - ${await prisma.user.count()} users`);
  console.log(`   - ${await prisma.iH.count()} inventory holders`);
  console.log(`   - ${await prisma.iHMember.count()} IH memberships`);
  console.log(`   - ${await prisma.sloc.count()} storage locations`);
  console.log(`   - ${await prisma.item.count()} items`);
  console.log(`   - ${await prisma.requester.count()} requesters (legacy)`);
  console.log(`   - ${await prisma.loggies.count()} loggies (legacy)`);
  console.log(`   - ${await prisma.loanRequest.count()} loan requests`);
  console.log(`   - ${await prisma.loanItemDetail.count()} loan item details`);

  console.log('\n👥 Test Users Created:');
  console.log('   ADMIN:');
  console.log(`     - Admin User (@admin) - Telegram ID: 111111111`);
  console.log('   LOGS:');
  console.log(`     - Mike Taylor (@miket) - Telegram ID: 222222221`);
  console.log(`     - Sarah Connor (@sarahc) - Telegram ID: 222222222`);
  console.log('   IH:');
  console.log(`     - John Doe (@johndoe) - Telegram ID: 333333331`);
  console.log(`     - Jane Smith (@janesmith) - Telegram ID: 333333332`);
  console.log(`     - Bob Johnson (@bobjohnson) - Telegram ID: 333333333`);
  console.log(`     - Emily Davis (@emilydavis) - Telegram ID: 333333334`);
  console.log('   REQUESTER:');
  console.log(`     - Alice Williams (@alicew) - Telegram ID: 444444441`);
  console.log(`     - Charlie Brown (@charlieb) - Telegram ID: 444444442`);
  console.log(`     - Diana Prince (@dianap) - Telegram ID: 444444443`);

  console.log('\n🏢 IH Group Ownership Example:');
  console.log(`   IH003 (Computing Club Logistics) - GROUP type`);
  console.log(`     Primary POC: Bob Johnson (@bobjohnson)`);
  console.log(`     Secondary POC: Emily Davis (@emilydavis)`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

