import { getItems } from "../utils/server/item";
import { Paginated, PaginationParams } from "./pagination";

export type ItemView = Awaited<ReturnType<typeof getItems>>[number];

// Type for paginated items API response
export type PaginatedItemsResponse = Paginated<ItemView>;

export type ItemSortOption = "name" | "quantity" | "id";

type ItemParams = {
    sort: ItemSortOption;
    asc: boolean;
    search?: string;
    slocId?: string;
    ihId?: string;
}

export type ItemPaginationParams = PaginationParams<ItemParams>;
