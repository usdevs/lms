import { getSlocs } from "../utils/server/slocs";

export type SlocView = Awaited<ReturnType<typeof getSlocs>>[number]
