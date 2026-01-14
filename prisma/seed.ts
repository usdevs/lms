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

  // 5. Create Items (100 items for pagination testing)
  console.log('Creating 100 items...');
  
  const itemDescriptions = [
    'Laptop Computer', 'Projector', 'Microphone Set', 'Sound System', 'Table',
    'Chair', 'Whiteboard', 'Marker Set', 'Extension Cord', 'HDMI Cable',
    'USB Hub', 'Webcam', 'Keyboard', 'Mouse', 'Monitor',
    'Printer', 'Scanner', 'Document Camera', 'Speaker System', 'Mixer Board',
    'Microphone Stand', 'Headset', 'Tripod', 'Camera', 'Video Recorder',
    'LED Panel', 'Stage Light', 'Fog Machine', 'Laser Pointer', 'Remote Control',
    'Battery Pack', 'Charging Station', 'Tablet', 'Smartphone', 'Router',
    'Switch', 'Access Point', 'Ethernet Cable', 'Power Strip', 'Surge Protector',
    'Tool Kit', 'Screwdriver Set', 'Measuring Tape', 'Level', 'Hammer',
    'Drill', 'Saw', 'Wrench Set', 'Pliers', 'Wire Cutters',
    'First Aid Kit', 'Fire Extinguisher', 'Safety Cone', 'Warning Sign', 'Barrier Tape',
    'Tent', 'Canopy', 'Tablecloth', 'Chair Cover', 'Banner Stand',
    'Display Board', 'Easel', 'Flip Chart', 'Poster Board', 'Name Tag',
    'Lanyard', 'Badge Holder', 'Clipboard', 'Folder', 'Binder',
    'Stapler', 'Paper Clip', 'Rubber Band', 'Tape Dispenser', 'Label Maker',
    'Calculator', 'Stopwatch', 'Timer', 'Thermometer', 'Barometer',
    'Measuring Scale', 'Ruler', 'Protractor', 'Compass', 'Magnifying Glass',
    'Flashlight', 'Lantern', 'Generator', 'Extension Ladder', 'Step Stool',
    'Storage Box', 'Filing Cabinet', 'Bookshelf', 'Desk Organizer', 'Pen Holder',
    'Notebook', 'Sticky Note', 'Highlighter', 'Eraser', 'Sharpener',
  ];

  const uoms = ['units', 'sets', 'pairs', 'boxes', 'packs', 'rolls', 'sheets', 'pieces'];
  const slocs = [sloc1, sloc2, sloc3];
  const ihs = [ih1, ih2, ih3];
  
  const items = [];
  for (let i = 1; i <= 100; i++) {
    const sloc = slocs[Math.floor(Math.random() * slocs.length)];
    const ih = ihs[Math.floor(Math.random() * ihs.length)];
    const description = itemDescriptions[Math.floor(Math.random() * itemDescriptions.length)];
    const uom = uoms[Math.floor(Math.random() * uoms.length)];
    const quantity = Math.floor(Math.random() * 50) + 1; // 1-50
    const year = 2023 + Math.floor(Math.random() * 2); // 2023 or 2024
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const purchaseDate = new Date(year, month, day);
    
    // Some items have RFP numbers, some don't
    const hasRfp = Math.random() > 0.3;
    const rfpNumber = hasRfp ? `RFP-${year}-${String(i).padStart(3, '0')}` : null;
    
    // Some items have remarks, some don't
    const hasRemarks = Math.random() > 0.5;
    const remarks = hasRemarks ? [
      'Brand new condition',
      'Requires maintenance',
      'Reserved for events',
      'Available for loan',
      'High demand item',
      'Needs replacement',
      'Excellent condition',
      'Minor wear and tear',
    ][Math.floor(Math.random() * 8)] : null;

    const item = await prisma.item.create({
      data: {
        itemDesc: description,
        itemSloc: sloc.slocId,
        itemIh: ih.ihId,
        itemQty: quantity,
        itemUom: uom,
        itemPurchaseDate: purchaseDate,
        itemRfpNumber: rfpNumber,
        itemRemarks: remarks,
      },
    });
    items.push(item);
  }
  
  console.log(`Created ${items.length} items`);

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
  // Use first few items from the generated items array
  if (items.length >= 5) {
    await prisma.loanItemDetail.create({
      data: {
        refNo: loanRequest1.refNo,
        itemId: items[0].itemId,
        loanQty: 2,
        loanStatus: 'loaned',
        itemSlocAtLoan: sloc1.slocId,
        itemIhAtLoan: ih1.ihId,
      },
    });
    await prisma.loanItemDetail.create({
      data: {
        refNo: loanRequest1.refNo,
        itemId: items[1].itemId,
        loanQty: 1,
        loanStatus: 'loaned',
        itemSlocAtLoan: sloc1.slocId,
        itemIhAtLoan: ih1.ihId,
      },
    });
    await prisma.loanItemDetail.create({
      data: {
        refNo: loanRequest2.refNo,
        itemId: items[2].itemId,
        loanQty: 5,
        loanStatus: 'pending',
        itemSlocAtLoan: sloc2.slocId,
        itemIhAtLoan: ih2.ihId,
      },
    });
    await prisma.loanItemDetail.create({
      data: {
        refNo: loanRequest2.refNo,
        itemId: items[3].itemId,
        loanQty: 1,
        loanStatus: 'pending',
        itemSlocAtLoan: sloc3.slocId,
        itemIhAtLoan: ih3.ihId,
      },
    });
    await prisma.loanItemDetail.create({
      data: {
        refNo: loanRequest3.refNo,
        itemId: items[4].itemId,
        loanQty: 10,
        loanStatus: 'approved',
        itemSlocAtLoan: sloc2.slocId,
        itemIhAtLoan: ih2.ihId,
      },
    });
  }

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

