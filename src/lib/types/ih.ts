import { getIHs } from "../utils/server/ih";

export type IHView = Awaited<ReturnType<typeof getIHs>>[number];
