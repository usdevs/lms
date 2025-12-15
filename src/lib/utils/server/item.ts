import prisma from "@/lib/prisma";

export const getItems = async () =>
  prisma.item.findMany({
    include: {
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
        },
      },
    },
  });

export type ItemView = Awaited<ReturnType<typeof getItems>>[number];

export const getSlocs = async () =>
  prisma.sloc.findMany({
    select: {
      slocId: true,
      slocName: true,
    },
  });

export type SlocView = Awaited<ReturnType<typeof getSlocs>>[number];

export const getIHs = async () =>
  prisma.iH.findMany({
    select: {
      ihId: true,
      ihName: true,
    },
  });

export type IHView = Awaited<ReturnType<typeof getIHs>>[number];

