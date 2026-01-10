import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  const { slocId, slocName } = await req.json();

  if (!slocName) return NextResponse.json({ error: "slocName required" }, { status: 400 });

  const newSloc = await prisma.sloc.create({
    data: { slocId, slocName },
  });

  return NextResponse.json(newSloc);
};

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? "";

  const slocs = await prisma.sloc.findMany({
  where: {
    slocName: { contains: query, mode: "insensitive" },
    isActive: true, // Only return active rows
  },
  take: 10,
});

  return NextResponse.json(slocs);
};

export const DELETE = async (req: NextRequest) => {
  const url = new URL(req.url);
  const slocId = url.searchParams.get("id");

  if (!slocId) {
    return NextResponse.json(
      { error: "slocId required" },
      { status: 400 }
    );
  }
  try {
    const count = await prisma.item.count({
      where: { itemSloc: slocId },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: "Sloc is in use and cannot be deleted" },
        { status: 409 }
      );
    }

    await prisma.sloc.update({
      where: { slocId },
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