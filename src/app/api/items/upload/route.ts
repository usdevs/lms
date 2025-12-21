import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

export const POST = async (req: Request) => {
    const formData = await req.formData();
    const file = formData.get("photo") as File;

    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, {status: 400}); 
    }

    const uploadsDir = path.join(process.cwd(), "public/uploads"); 
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); // Creates uploads folder 
    
    const uniqueName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, uniqueName);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const url = `/uploads/${uniqueName}`;
    return NextResponse.json({ url });
};

// Pagination 
export const GET = async (req: Request) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "27");
    const skip = (page - 1) * limit;

    const items = await prisma.item.findMany({
        skip,
        take: limit,
        orderBy: { itemId: "desc" }, 
        select: {
            itemId: true,
            nuscSn: true,
            itemDesc: true,
            itemQty: true,
            itemUom: true,
            itemRemarks: true,
            itemPurchaseDate: true,
            itemRfpNumber: true,
            itemImage: true,
            itemSloc: true,
            itemIh: true,
            sloc: {
                select: {
                    slocId: true,
                    slocName: true,
                },
            },
            ih: {
                select: {
                    ihId: true,
                    ihName: true,
                }
            }
        },        
    });

    const totalItems = await prisma.item.count();

    return NextResponse.json({
        items,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
    });
};