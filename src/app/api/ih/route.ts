import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  const { ihId, ihName } = await req.json();

  if (!ihName) return NextResponse.json({ error: "ihName required" }, { status: 400 });

  const newIh = await prisma.iH.create({
    data: { ihId, ihName },
  });

  return NextResponse.json(newIh);
};

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? "";

  const ihs = await prisma.iH.findMany({
  where: { 
    ihName: { contains: query, mode: "insensitive" }, 
    isActive: true,
  },
  take: 10,
  });

  return NextResponse.json(ihs);
};

export const DELETE = async (req: NextRequest) => {
  const url = new URL(req.url);
  const ihId = url.searchParams.get("id");

  if (!ihId) {
    return NextResponse.json(
      { error: "ihId required" },
      { status: 400 }
    );
  }
  try {
    const count = await prisma.item.count({
      where: { itemIh: ihId },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: "IH is in use and cannot be deleted" },
        { status: 409 }
      );
    }

    await prisma.iH.update({
      where: { ihId },
      data: { isActive: false }, // Disable row 
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
};