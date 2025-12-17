import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.loanItemDetail.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.item.deleteMany();

  
  await prisma.iHMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sloc.deleteMany();
  await prisma.iH.deleteMany();

  // 1. Create Sloc
  console.log('Creating storage locations...');
  const sloc1 = await prisma.sloc.create({ data: { slocId: 'SLOC001', slocName: 'Main Warehouse' } });
  const sloc2 = await prisma.sloc.create({ data: { slocId: 'SLOC002', slocName: 'Secondary Storage' } });
  const sloc3 = await prisma.sloc.create({ data: { slocId: 'SLOC003', slocName: 'Equipment Room' } });

  // 2. Create Users
  console.log('Creating users...');
  
  // Admin
  const admin = await prisma.user.create({
    data: { telegramId: BigInt(111111111), username: 'admin', firstName: 'Admin', role: 'ADMIN', nusnetId: 'e0000000' }
  });

  // Logs
  const logs1 = await prisma.user.create({
    data: { telegramId: BigInt(222222221), username: 'miket', firstName: 'Mike', role: 'LOGS', nusnetId: 'e4567890' }
  });
  const logs2 = await prisma.user.create({
    data: { telegramId: BigInt(222222222), username: 'sarahc', firstName: 'Sarah', role: 'LOGS', nusnetId: 'e5678901' }
  });

  // IH Users
  const ihUser1 = await prisma.user.create({
    data: { telegramId: BigInt(333333331), username: 'johndoe', firstName: 'John', role: 'IH', nusnetId: 'e1111111' }
  });
  const ihUser2 = await prisma.user.create({
    data: { telegramId: BigInt(333333332), username: 'janesmith', firstName: 'Jane', role: 'IH', nusnetId: 'e2222222' }
  });
  const ihUser3 = await prisma.user.create({
    data: { telegramId: BigInt(333333333), username: 'bobjohnson', firstName: 'Bob', role: 'IH', nusnetId: 'e3333333' }
  });
  const ihUser4 = await prisma.user.create({
    data: { telegramId: BigInt(333333334), username: 'emilydavis', firstName: 'Emily', role: 'IH', nusnetId: 'e4444444' }
  });

  // Requesters
  const req1 = await prisma.user.create({
    data: { telegramId: BigInt(444444441), username: 'alicew', firstName: 'Alice', role: 'REQUESTER', nusnetId: 'e1234567' }
  });
  const req2 = await prisma.user.create({
    data: { telegramId: BigInt(444444442), username: 'charlieb', firstName: 'Charlie', role: 'REQUESTER', nusnetId: 'e2345678' }
  });
  const req3 = await prisma.user.create({
    data: { telegramId: BigInt(444444443), username: 'dianap', firstName: 'Diana', role: 'REQUESTER', nusnetId: 'e3456789' }
  });

  // 3. Create IH
  console.log('Creating IHs...');
  const ih1 = await prisma.iH.create({
    data: { ihId: 'IH001', ihName: 'John Doe', ihType: 'INDIVIDUAL' }
  });
  const ih2 = await prisma.iH.create({
    data: { ihId: 'IH002', ihName: 'Jane Smith', ihType: 'INDIVIDUAL' }
  });
  const ih3 = await prisma.iH.create({
    data: { ihId: 'IH003', ihName: 'NUSC Club Logistics', ihType: 'GROUP' }
  });

  // 4. Create IH Members
  console.log('Creating IH Members...');
  await prisma.iHMember.create({ data: { userId: ihUser1.userId, ihId: ih1.ihId, isPrimary: true } });
  await prisma.iHMember.create({ data: { userId: ihUser2.userId, ihId: ih2.ihId, isPrimary: true } });
  await prisma.iHMember.create({ data: { userId: ihUser3.userId, ihId: ih3.ihId, isPrimary: true } });
  await prisma.iHMember.create({ data: { userId: ihUser4.userId, ihId: ih3.ihId, isPrimary: false } });

  // 5. Create Items
  console.log('Creating items...');
  const item1 = await prisma.item.create({
    data: { nuscSn: 'ITEM001', itemDesc: 'Laptop', itemSloc: sloc1.slocId, itemIh: ih1.ihId, itemQty: 5, itemUom: 'units' }
  });
  const item2 = await prisma.item.create({
    data: { nuscSn: 'ITEM002', itemDesc: 'Projector', itemSloc: sloc1.slocId, itemIh: ih1.ihId, itemQty: 3, itemUom: 'units' }
  });
  const item3 = await prisma.item.create({
    data: { nuscSn: 'ITEM003', itemDesc: 'Mic', itemSloc: sloc2.slocId, itemIh: ih2.ihId, itemQty: 10, itemUom: 'sets' }
  });
  const item4 = await prisma.item.create({
    data: { nuscSn: 'ITEM004', itemDesc: 'Sound System', itemSloc: sloc3.slocId, itemIh: ih3.ihId, itemQty: 2, itemUom: 'units' }
  });
  const item5 = await prisma.item.create({
    data: { nuscSn: 'ITEM005', itemDesc: 'Table', itemSloc: sloc2.slocId, itemIh: ih2.ihId, itemQty: 20, itemUom: 'units' }
  });

  // 6. Create Loan Requests
  // IMPORTANT: We use 'reqId' and 'loggieId' which should point to USERS. 
  // If we are in the middle of migration where we have newReqId, this might need adjustment, 
  // but we are targeting the FINAL schema state.
  console.log('Creating loan requests...');
  
  // Note: If you run this BEFORE the final rename migration, you might need to use 'newReqId' instead of 'reqId'.
  // But standard practice is seed aligns with schema. We will ensure schema aligns.
  
  const lr1 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2024-12-20'),
      loanDateEnd: new Date('2024-12-22'),
      // Assuming FINAL schema has reqId pointing to User
      reqId: req1.userId,
      loggieId: logs1.userId,
      organisation: 'Computing Club',
      requestStatus: 'approved'
    }
  });

  const lr2 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2024-12-25'),
      loanDateEnd: new Date('2024-12-27'),
      reqId: req2.userId,
      loggieId: logs2.userId,
      organisation: 'Engin Soc',
      requestStatus: 'pending'
    }
  });

  const lr3 = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date('2025-01-05'),
      loanDateEnd: new Date('2025-01-07'),
      reqId: req3.userId,
      organisation: 'NUSSU',
      requestStatus: 'approved'
    }
  });

  // 7. Loan Details
  await prisma.loanItemDetail.create({ data: { refNo: lr1.refNo, itemId: item1.itemId, loanQty: 2, loanStatus: 'loaned', itemSlocAtLoan: sloc1.slocId, itemIhAtLoan: ih1.ihId } });
  await prisma.loanItemDetail.create({ data: { refNo: lr1.refNo, itemId: item2.itemId, loanQty: 1, loanStatus: 'loaned', itemSlocAtLoan: sloc1.slocId, itemIhAtLoan: ih1.ihId } });
  await prisma.loanItemDetail.create({ data: { refNo: lr2.refNo, itemId: item3.itemId, loanQty: 5, loanStatus: 'pending', itemSlocAtLoan: sloc2.slocId, itemIhAtLoan: ih2.ihId } });
  await prisma.loanItemDetail.create({ data: { refNo: lr2.refNo, itemId: item4.itemId, loanQty: 1, loanStatus: 'pending', itemSlocAtLoan: sloc3.slocId, itemIhAtLoan: ih3.ihId } });
  await prisma.loanItemDetail.create({ data: { refNo: lr3.refNo, itemId: item5.itemId, loanQty: 10, loanStatus: 'approved', itemSlocAtLoan: sloc2.slocId, itemIhAtLoan: ih2.ihId } });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

