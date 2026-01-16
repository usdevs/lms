import { getItems } from "../utils/server/item";
import { Paginated, PaginationParams } from "./pagination";

export type ItemView = Awaited<ReturnType<typeof getItems>>[number];

// Enriched item view with loan calculations
export type EnrichedItemView = ItemView & {
  totalQty: number;
  netQty: number;
};

// Type for paginated items API response
export type PaginatedItemsResponse = Paginated<EnrichedItemView>;

export type ItemSortOption = "name" | "quantity" | "id";

type ItemParams = {
    sort: ItemSortOption;
    asc: boolean;
    search?: string;
    slocId?: string;
    ihId?: string;
}

export type ItemPaginationParams = PaginationParams<ItemParams>;
