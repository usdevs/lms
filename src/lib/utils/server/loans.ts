import prisma from "@/lib/prisma";

export const getLoans = async () =>
  prisma.loanRequest.findMany({
    include: {
      requester: true,
      loanDetails: {
        include: {
          item: true
        }
      }
    },
    orderBy: { refNo: 'desc' }
  });
