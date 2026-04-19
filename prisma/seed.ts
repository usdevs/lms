import {
  IHType,
  LoanItemStatus,
  LoanRequestStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { pipeline } from "@xenova/transformers";

const prisma = new PrismaClient();

class EmbeddingPipeline {
  static task = "feature-extraction" as const;
  static model = "Xenova/all-MiniLM-L6-v2";
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === "") return [];

  const extractor = await EmbeddingPipeline.getInstance();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function attachItemEmbedding(item: {
  itemId: number;
  itemDesc: string;
  itemRemarks: string | null;
  itemSloc: string;
  itemIh: string;
}) {
  const searchableText =
    `${item.itemDesc} ${item.itemRemarks || ""} ${item.itemSloc} ${item.itemIh}`.trim();
  const embeddingVector = await generateEmbedding(searchableText);
  const vectorString = `[${embeddingVector.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE item
    SET item_embedding = ${vectorString}::vector
    WHERE item_id = ${item.itemId}
  `;
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
  await prisma.user.create({
    data: {
      telegramId: "10001",
      telegramHandle: "admin",
      firstName: "Admin",
      lastName: "User",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      role: UserRole.ADMIN,
      nusnetId: "e0000000",
    },
  });

  const logs1 = await prisma.user.create({
    data: {
      telegramId: "10002",
      telegramHandle: "miket",
      firstName: "Mike",
      lastName: "Tan",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
      role: UserRole.LOGS,
      nusnetId: "e4567890",
    },
  });

  const logs2 = await prisma.user.create({
    data: {
      telegramId: "10003",
      telegramHandle: "sarahc",
      firstName: "Sarah",
      lastName: "Chong",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      role: UserRole.LOGS,
      nusnetId: "e5678901",
    },
  });

  const ihUser1 = await prisma.user.create({
    data: {
      telegramId: "10004",
      telegramHandle: "johndoe",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.IH,
      nusnetId: "e1111111",
    },
  });

  const ihUser2 = await prisma.user.create({
    data: {
      telegramId: "10005",
      telegramHandle: "janesmith",
      firstName: "Jane",
      lastName: "Smith",
      role: UserRole.IH,
      nusnetId: "e2222222",
    },
  });

  const ihUser3 = await prisma.user.create({
    data: {
      telegramId: "10006",
      telegramHandle: "bobjohnson",
      firstName: "Bob",
      lastName: "Johnson",
      role: UserRole.IH,
      nusnetId: "e3333333",
    },
  });

  const ihUser4 = await prisma.user.create({
    data: {
      telegramId: "10007",
      telegramHandle: "emilydavis",
      firstName: "Emily",
      lastName: "Davis",
      role: UserRole.IH,
      nusnetId: "e4444444",
    },
  });

  const req1 = await prisma.user.create({
    data: {
      telegramId: "10008",
      telegramHandle: "alicew",
      firstName: "Alice",
      lastName: "Wong",
      role: UserRole.REQUESTER,
      nusnetId: "e1234567",
    },
  });

  const req2 = await prisma.user.create({
    data: {
      telegramId: "10009",
      telegramHandle: "charlieb",
      firstName: "Charlie",
      lastName: "Boon",
      role: UserRole.REQUESTER,
      nusnetId: "e2345678",
    },
  });

  const req3 = await prisma.user.create({
    data: {
      telegramId: "10010",
      telegramHandle: "dianap",
      firstName: "Diana",
      lastName: "Pillai",
      role: UserRole.REQUESTER,
      nusnetId: "e3456789",
    },
  });

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

  console.log("Creating items...");
  const item1 = await prisma.item.create({
    data: {
      itemDesc: "Dell Latitude Laptop",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih1.ihId,
      itemQty: 5,
      itemUom: "units",
      itemPurchaseDate: new Date("2025-01-12"),
      itemRfpNumber: "RFP-IT-2025-001",
      itemRemarks: "Kept with chargers in the blue cabinet.",
    },
  });

  const item2 = await prisma.item.create({
    data: {
      itemDesc: "Epson Projector",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih1.ihId,
      itemQty: 3,
      itemUom: "units",
      itemPurchaseDate: new Date("2024-11-03"),
      itemRfpNumber: "RFP-AV-2024-014",
      itemRemarks: "HDMI cable stored separately.",
    },
  });

  const item3 = await prisma.item.create({
    data: {
      itemDesc: "Wireless Microphone Set",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih2.ihId,
      itemQty: 10,
      itemUom: "sets",
      itemPurchaseDate: new Date("2025-02-20"),
      itemRemarks: "Recharge batteries after use.",
    },
  });

  const item4 = await prisma.item.create({
    data: {
      itemDesc: "Portable Sound System",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 2,
      itemUom: "units",
      itemPurchaseDate: new Date("2024-08-18"),
      itemRfpNumber: "RFP-EVT-2024-022",
      itemRemarks: "Heavy item. Two-person carry recommended.",
    },
  });

  const item5 = await prisma.item.create({
    data: {
      itemDesc: "Folding Table",
      itemSloc: secondaryStorage.slocId,
      itemIh: ih2.ihId,
      itemQty: 20,
      itemUom: "units",
      itemRemarks: "Stored on the rear rack.",
    },
  });

  const item6 = await prisma.item.create({
    data: {
      itemDesc: "First Aid Kit",
      itemSloc: equipmentRoom.slocId,
      itemIh: ih3.ihId,
      itemQty: 6,
      itemUom: "kits",
      itemPurchaseDate: new Date("2025-03-01"),
      itemRemarks: "Consumables are topped up monthly.",
      itemExpendable: true,
    },
  });

  const item7 = await prisma.item.create({
    data: {
      itemDesc: "Fire Safety Signage",
      itemSloc: mainWarehouse.slocId,
      itemIh: ih3.ihId,
      itemQty: 4,
      itemUom: "sets",
      itemRemarks: "Display-only item, not for loan.",
      itemUnloanable: true,
    },
  });

  console.log("Generating item embeddings...");
  for (const item of [item1, item2, item3, item4, item5, item6, item7]) {
    await attachItemEmbedding(item);
  }

  console.log("Creating loan requests...");
  const pendingLoan = await prisma.loanRequest.create({
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
  });

  const ongoingLoan = await prisma.loanRequest.create({
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
  });

  const completedLoan = await prisma.loanRequest.create({
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
  });

  const rejectedLoan = await prisma.loanRequest.create({
    data: {
      loanDateStart: new Date("2026-05-02"),
      loanDateEnd: new Date("2026-05-04"),
      reqId: req1.userId,
      organisation: "Community Service Club",
      eventDetails: "Outdoor activation with display materials",
      eventLocation: "Town Green",
      loanRequestStatus: LoanRequestStatus.REJECTED,
    },
  });

  console.log("Creating loan item details...");
  await prisma.loanItemDetail.createMany({
    data: [
      {
        refNo: pendingLoan.refNo,
        itemId: item1.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.PENDING,
      },
      {
        refNo: pendingLoan.refNo,
        itemId: item2.itemId,
        loanQty: 1,
        loanItemStatus: LoanItemStatus.PENDING,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: item3.itemId,
        loanQty: 4,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: item4.itemId,
        loanQty: 1,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: ongoingLoan.refNo,
        itemId: item6.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.ON_LOAN,
      },
      {
        refNo: completedLoan.refNo,
        itemId: item5.itemId,
        loanQty: 8,
        loanItemStatus: LoanItemStatus.RETURNED,
      },
      {
        refNo: completedLoan.refNo,
        itemId: item3.itemId,
        loanQty: 2,
        loanItemStatus: LoanItemStatus.RETURNED_LATE,
      },
      {
        refNo: rejectedLoan.refNo,
        itemId: item7.itemId,
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
