import {
  IHType,
  LoanItemStatus,
  LoanRequestStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import {
  buildItemSearchableText,
  generateEmbedding,
  toPgVectorString,
} from "../src/lib/ai";

const prisma = new PrismaClient();

const IMAGE_URLS = {
  dellLatitude:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Dell%20Latitudes.jpg",
  lcdProjector:
    'https://commons.wikimedia.org/wiki/Special:FilePath/%22LCD%20Projector%22.jpg',
  wirelessMicrophone:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Wireless%20Microphone%20-%20Off%20%2814751164874%29.jpg",
  foldingTable:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Folding%20table.jpg",
  firstAidKit:
    "https://commons.wikimedia.org/wiki/Special:FilePath/First%20aid%20kit.jpg",
  fireExitSign:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Old-style%20fire%20exit%20sign%20%2826009222722%29.jpg",
  draculaCover:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Dracula%20cover%20600px.jpg",
  aliceCover:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Alice%27s%20Adventures%20in%20Wonderland%20-%20Upper%20cover%20%28c183d4%29.jpg",
  cocaColaCan:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Coca-Cola%20330ml%20can.jpg",
  doveShampoo:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Dove%20shampoo%20bottle.jpg",
  nikonD3500:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Nikon%20D3500.jpg",
  unoCards:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Uno.jpg",
} as const;

type SeedItemInput = {
  key: string;
  itemDesc: string;
  itemSloc: string;
  itemIh: string;
  itemQty: number;
  itemUom: string;
  itemPurchaseDate?: string;
  itemRfpNumber?: string;
  itemRemarks?: string;
  itemImage?: string;
  itemExpendable?: boolean;
  itemUnloanable?: boolean;
};

async function attachItemEmbedding(item: {
  itemId: number;
  itemDesc: string;
  itemRemarks: string | null;
  itemSloc: string;
  itemIh: string;
}) {
  const searchableText = buildItemSearchableText({
    itemDesc: item.itemDesc,
    itemRemarks: item.itemRemarks,
    itemSloc: item.itemSloc,
    itemIh: item.itemIh,
  });
  const embeddingVector = await generateEmbedding(searchableText);
  const vectorString = toPgVectorString(embeddingVector);

  await prisma.$executeRaw`
    UPDATE item
    SET item_embedding = ${vectorString}::vector
    WHERE item_id = ${item.itemId}
  `;
  await prisma.item.update({
    where: { itemId: item.itemId },
    data: {
      itemNeedsReindex: false,
      itemLastIndexedAt: new Date(),
    },
  });
}

async function clearExistingData() {
  await prisma.$transaction([
    prisma.loanItemDetail.deleteMany(),
    prisma.loanRequest.deleteMany(),
    prisma.item.deleteMany(),
    prisma.iHMember.deleteMany(),
    prisma.iH.deleteMany(),
    prisma.user.deleteMany(),
    prisma.sloc.deleteMany(),
  ]);
}

async function main() {
  console.log("Starting seed...");

  console.log("Clearing existing data...");
  await clearExistingData();

  console.log("Creating storage locations...");
  const [mainWarehouse, secondaryStorage, equipmentRoom] = await Promise.all([
    prisma.sloc.create({
      data: { slocId: "SLOC001", slocName: "Main Warehouse" },
    }),
    prisma.sloc.create({
      data: { slocId: "SLOC002", slocName: "Secondary Storage" },
    }),
    prisma.sloc.create({
      data: { slocId: "SLOC003", slocName: "Equipment Room" },
    }),
  ]);

  console.log("Creating users...");
  const [
    adminUser,
    logs1,
    logs2,
    ihUser1,
    ihUser2,
    ihUser3,
    ihUser4,
    req1,
    req2,
    req3,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        telegramId: "10001",
        telegramHandle: "admin",
        firstName: "Admin",
        lastName: "User",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        role: UserRole.ADMIN,
        nusnetId: "e0000000",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10002",
        telegramHandle: "miket",
        firstName: "Mike",
        lastName: "Tan",
        photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
        role: UserRole.LOGS,
        nusnetId: "e4567890",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10003",
        telegramHandle: "sarahc",
        firstName: "Sarah",
        lastName: "Chong",
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        role: UserRole.LOGS,
        nusnetId: "e5678901",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10004",
        telegramHandle: "johndoe",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.IH,
        nusnetId: "e1111111",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10005",
        telegramHandle: "janesmith",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.IH,
        nusnetId: "e2222222",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10006",
        telegramHandle: "bobjohnson",
        firstName: "Bob",
        lastName: "Johnson",
        role: UserRole.IH,
        nusnetId: "e3333333",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10007",
        telegramHandle: "emilydavis",
        firstName: "Emily",
        lastName: "Davis",
        role: UserRole.IH,
        nusnetId: "e4444444",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10008",
        telegramHandle: "alicew",
        firstName: "Alice",
        lastName: "Wong",
        role: UserRole.REQUESTER,
        nusnetId: "e1234567",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10009",
        telegramHandle: "charlieb",
        firstName: "Charlie",
        lastName: "Boon",
        role: UserRole.REQUESTER,
        nusnetId: "e2345678",
      },
    }),
    prisma.user.create({
      data: {
        telegramId: "10010",
        telegramHandle: "dianap",
        firstName: "Diana",
        lastName: "Pillai",
        role: UserRole.REQUESTER,
        nusnetId: "e3456789",
      },
    }),
  ]);
  void adminUser;

  console.log("Creating IHs and memberships...");
  const [ih1, ih2, ih3] = await Promise.all([
    prisma.iH.create({
      data: { ihId: "IH001", ihName: "John Doe", ihType: IHType.INDIVIDUAL },
    }),
    prisma.iH.create({
      data: { ihId: "IH002", ihName: "Jane Smith", ihType: IHType.INDIVIDUAL },
    }),
    prisma.iH.create({
      data: {
        ihId: "IH003",
        ihName: "NUSC Club Logistics",
        ihType: IHType.GROUP,
      },
    }),
  ]);

  await prisma.iHMember.createMany({
    data: [
      { userId: ihUser1.userId, ihId: ih1.ihId, isPrimary: true },
      { userId: ihUser2.userId, ihId: ih2.ihId, isPrimary: true },
      { userId: ihUser3.userId, ihId: ih3.ihId, isPrimary: true },
      { userId: ihUser4.userId, ihId: ih3.ihId, isPrimary: false },
    ],
  });

  const itemInputs: SeedItemInput[] = [
    {
      key: "laptop",
      itemDesc: "Dell Latitude Laptop",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih1.ihId,
      itemQty: 5,
      itemUom: "units",
      itemPurchaseDate: "2025-01-12",
      itemRfpNumber: "RFP-IT-2025-001",
      itemRemarks: "Kept with chargers in the blue cabinet.",
      itemImage: IMAGE_URLS.dellLatitude,
    },
    {
      key: "projector",
      itemDesc: "Epson Projector",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih1.ihId,
      itemQty: 3,
      itemUom: "units",
      itemPurchaseDate: "2024-11-03",
      itemRfpNumber: "RFP-AV-2024-014",
      itemRemarks: "HDMI cable stored separately.",
      itemImage: IMAGE_URLS.lcdProjector,
    },
    {
      key: "microphone",
      itemDesc: "Wireless Microphone Set",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih2.ihId,
      itemQty: 10,
      itemUom: "sets",
      itemPurchaseDate: "2025-02-20",
      itemRemarks: "Recharge batteries after use.",
      itemImage: IMAGE_URLS.wirelessMicrophone,
    },
    {
      key: "soundSystem",
      itemDesc: "Portable Sound System",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 2,
      itemUom: "units",
      itemPurchaseDate: "2024-08-18",
      itemRfpNumber: "RFP-EVT-2024-022",
      itemRemarks: "Heavy item. Two-person carry recommended.",
    },
    {
      key: "foldingTable",
      itemDesc: "Folding Table",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih2.ihId,
      itemQty: 20,
      itemUom: "units",
      itemRemarks: "Stored on the rear rack.",
      itemImage: IMAGE_URLS.foldingTable,
    },
    {
      key: "firstAid",
      itemDesc: "First Aid Kit",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 6,
      itemUom: "kits",
      itemPurchaseDate: "2025-03-01",
      itemRemarks: "Consumables are topped up monthly.",
      itemExpendable: true,
      itemImage: IMAGE_URLS.firstAidKit,
    },
    {
      key: "fireSign",
      itemDesc: "Fire Safety Signage",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih3.ihId,
      itemQty: 4,
      itemUom: "sets",
      itemRemarks: "Display-only item, not for loan.",
      itemUnloanable: true,
      itemImage: IMAGE_URLS.fireExitSign,
    },
    {
      key: "dracula",
      itemDesc: "Dracula Novel",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih2.ihId,
      itemQty: 6,
      itemUom: "copies",
      itemPurchaseDate: "2024-10-12",
      itemRemarks: "Text-heavy public-domain book cover for semantic prompt evaluation.",
      itemImage: IMAGE_URLS.draculaCover,
    },
    {
      key: "alice",
      itemDesc: "Alice's Adventures in Wonderland Book",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih2.ihId,
      itemQty: 5,
      itemUom: "copies",
      itemPurchaseDate: "2024-10-12",
      itemRemarks: "Classic illustrated cover with strong title text for OCR-style testing.",
      itemImage: IMAGE_URLS.aliceCover,
    },
    {
      key: "coke",
      itemDesc: "Coca-Cola Soft Drink Can",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 24,
      itemUom: "cans",
      itemPurchaseDate: "2025-02-05",
      itemRemarks: "Branded consumer packaging with a highly recognizable logo.",
      itemExpendable: true,
      itemImage: IMAGE_URLS.cocaColaCan,
    },
    {
      key: "dove",
      itemDesc: "Dove Shampoo Bottle",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 12,
      itemUom: "bottles",
      itemPurchaseDate: "2025-02-07",
      itemRemarks: "Labeled toiletries packaging for brand and product-type extraction.",
      itemExpendable: true,
      itemImage: IMAGE_URLS.doveShampoo,
    },
    {
      key: "nikon",
      itemDesc: "Nikon D3500 DSLR Camera",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih1.ihId,
      itemQty: 2,
      itemUom: "units",
      itemPurchaseDate: "2024-12-21",
      itemRfpNumber: "RFP-MEDIA-2024-031",
      itemRemarks: "Model-specific electronics image for product-name recognition.",
      itemImage: IMAGE_URLS.nikonD3500,
    },
    {
      key: "uno",
      itemDesc: "UNO Card Game",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih3.ihId,
      itemQty: 8,
      itemUom: "boxes",
      itemPurchaseDate: "2025-01-30",
      itemRemarks: "Packaging image with brand-level recognition and tabletop game semantics.",
      itemImage: IMAGE_URLS.unoCards,
    },
  ];

  console.log("Creating items...");
  const createdItems = await Promise.all(
    itemInputs.map(async ({ key, itemPurchaseDate, ...item }) => {
      const created = await prisma.item.create({
        data: {
          ...item,
          itemPurchaseDate: itemPurchaseDate ? new Date(itemPurchaseDate) : null,
        },
      });
      return [key, created] as const;
    }),
  );
  const items = Object.fromEntries(createdItems);

  console.log("Generating item embeddings...");
  for (const item of Object.values(items)) {
    await attachItemEmbedding(item);
  }

  console.log("Creating loan requests...");
  const [pendingLoan, ongoingLoan, completedLoan, rejectedLoan] =
    await Promise.all([
      prisma.loanRequest.create({
        data: {
          loanDateStart: new Date("2026-04-25"),
          loanDateEnd: new Date("2026-04-27"),
          reqId: req1.userId,
          loggieId: logs1.userId,
          organisation: "Computing Club",
          eventDetails: "Freshmen orientation booth setup",
          eventLocation: "UTown Plaza",
          loanRequestStatus: LoanRequestStatus.PENDING,
        },
      }),
      prisma.loanRequest.create({
        data: {
          loanDateStart: new Date("2026-04-18"),
          loanDateEnd: new Date("2026-04-20"),
          reqId: req2.userId,
          loggieId: logs2.userId,
          organisation: "Engineering Society",
          eventDetails: "Roadshow with stage audio support",
          eventLocation: "EA Forum",
          loanRequestStatus: LoanRequestStatus.ONGOING,
        },
      }),
      prisma.loanRequest.create({
        data: {
          loanDateStart: new Date("2026-04-10"),
          loanDateEnd: new Date("2026-04-12"),
          reqId: req3.userId,
          loggieId: logs1.userId,
          organisation: "NUSSU",
          eventDetails: "Weekend campus event",
          eventLocation: "Stephen Riady Centre",
          loanRequestStatus: LoanRequestStatus.COMPLETED,
        },
      }),
      prisma.loanRequest.create({
        data: {
          loanDateStart: new Date("2026-05-02"),
          loanDateEnd: new Date("2026-05-04"),
          reqId: req1.userId,
          organisation: "Community Service Club",
          eventDetails: "Outdoor activation with display materials",
          eventLocation: "Town Green",
          loanRequestStatus: LoanRequestStatus.REJECTED,
        },
      }),
    ]);

  console.log("Creating loan item details...");
  await prisma.loanItemDetail.createMany({
    data: [
      {
        refNo: pendingLoan.refNo,
        itemId: items.laptop.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.PENDING,
      },
      {
        refNo: pendingLoan.refNo,
        itemId: items.projector.itemId,
        loanQty: 1,
        loanItemStatus: LoanItemStatus.PENDING,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: items.microphone.itemId,
        loanQty: 4,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: items.soundSystem.itemId,
        loanQty: 1,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: items.firstAid.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: completedLoan.refNo,
        itemId: items.foldingTable.itemId,
        loanQty: 8,
        loanItemStatus: LoanItemStatus.RETURNED,
      },
      {
        refNo: completedLoan.refNo,
        itemId: items.microphone.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.RETURNED_LATE,
      },
      {
        refNo: rejectedLoan.refNo,
        itemId: items.fireSign.itemId,
        loanQty: 1,
        loanItemStatus: LoanItemStatus.REJECTED,
      },
    ],
  });

  const [userCount, ihCount, itemCount, loanCount] = await Promise.all([
    prisma.user.count(),
    prisma.iH.count(),
    prisma.item.count(),
    prisma.loanRequest.count(),
  ]);

  console.log(
    `Seed completed. Users: ${userCount}, IHs: ${ihCount}, Items: ${itemCount}, Loans: ${loanCount}`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
