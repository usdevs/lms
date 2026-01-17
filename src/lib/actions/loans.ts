
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Creates a new Loan Request and automatically decrements the item availability.
 */
export async function createLoanRequest(data: {
  loanDateStart: Date;
  loanDateEnd: Date;
  reqId: number;
  organisation: string;
  itemId: number;
  loanQty: number;
}) {

  const loanRequest = await prisma.$transaction(async (tx) => {
    // creates a loan request record
    const newRequest = await tx.loanRequest.create({
      data: {
        loanDateStart: data.loanDateStart,
        loanDateEnd: data.loanDateEnd,
        reqId: data.reqId,
        organisation: data.organisation,
        requestStatus: 'pending', //defaulting to the loan being pending for now
      },
    });

    await tx.loanItemDetail.create({
      data: {
        refNo: newRequest.refNo,
        itemId: data.itemId,
        loanQty: data.loanQty,
        loanStatus: 'loaned',
      },
    });

    await tx.item.update({
      where: { itemId: data.itemId },
      data: {
        itemAvailQty: {
          decrement: data.loanQty,
        },
      },
    });

    return newRequest;
  });

}