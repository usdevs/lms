"use client";

import { ChangeEvent, useState, useEffect, useCallback, useRef } from "react";
import { Search, RotateCcw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import EditItemModal from "./EditItemModal";
import DeleteItemButton from "./DeleteItemButton";
import type {
  ItemView,
  SlocView,
  IHView,
  PaginatedItemsResponse,
} from "@/lib/utils/server/item";

interface CatalogueProps {
  slocs: SlocView[];
  ihs: IHView[];
}

type SortOption = "name" | "quantity";

export default function Catalogue({ slocs, ihs }: CatalogueProps) {
  // Filters and Sort (server-side)
  const [searchString, setSearchString] = useState("");
  const [filterSloc, setFilterSloc] = useState<string>("");
  const [filterHolder, setFilterHolder] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [items, setItems] = useState<ItemView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 27;
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(
    async (pageNum: number, resetItems = false) => {
      setLoading(true);
      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
          sort: sortOption,
          asc: sortAsc.toString(),
        });

        if (searchString) {
          params.append("search", searchString);
        }
        if (filterSloc) {
          // Find slocId from slocName
          const sloc = slocs.find((s) => s.slocName === filterSloc);
          if (sloc) {
            params.append("sloc", sloc.slocId);
          }
        }
        if (filterHolder) {
          // Find ihId from ihName
          const ih = ihs.find((h) => h.ihName === filterHolder);
          if (ih) {
            params.append("ih", ih.ihId);
          }
        }

        const res = await fetch(`/api/items?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch items");
        }
        const data: PaginatedItemsResponse = await res.json();

        if (resetItems) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to fetch items", err);
      } finally {
        setLoading(false);
      }
    },
    [searchString, filterSloc, filterHolder, sortOption, sortAsc, slocs, ihs]
  );

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset and refetch when filters, sort, or searchString changes
  // This auto-fetches on any filter change (filterSloc, filterHolder, sortOption, sortAsc)
  // and also when searchString changes (which happens on Enter/blur)
  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchItems(1, true);
  }, [fetchItems]);

  const updateSearchString = (newSearchString: string) => {
    if (newSearchString === searchString) {
      return;
    }
    setSearchString(newSearchString);
  };

  const onSearchKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      ev.currentTarget.blur(); // Unfocus to trigger blur handler
      updateSearchString(ev.currentTarget.value);
    }
  };

  const onSearchBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
    updateSearchString(ev.currentTarget.value);
  };

  const clearSearch = () => {
    setSearchString("");
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const defaultFilters = {
    filterSloc: "",
    filterHolder: "",
    sortOption: "name" as SortOption,
    sortAsc: true,
  };
  const resetFilters = () => {
    setFilterSloc(defaultFilters.filterSloc);
    setFilterHolder(defaultFilters.filterHolder);
    setSortOption(defaultFilters.sortOption);
    setSortAsc(defaultFilters.sortAsc);
  };

  // Check if any filter is not in default state
  const hasActiveFilters = 
    filterSloc !== defaultFilters.filterSloc ||
    filterHolder !== defaultFilters.filterHolder ||
    sortOption !== defaultFilters.sortOption ||
    sortAsc !== defaultFilters.sortAsc;

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Catalogue</h1>
          <p className="text-white/80">{items.length} ITEMS</p>
        </div>
        <EditItemModal slocs={slocs} ihs={ihs} mode="add" />
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search items by description, ID, location..."
            className="w-full pl-10 pr-10 text-white placeholder:text-white/60 bg-white/10 border-white/20 focus-visible:ring-white/50 [&::-webkit-search-cancel-button]:hidden"
            onKeyDown={onSearchKeyDown}
            onBlur={onSearchBlur}
          />
          {searchString && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      <div className="flex gap-3 flex-wrap">
      
      {/*Reset Filters Button - only show when filters are active */}
      {hasActiveFilters && (
        <button
           onClick={resetFilters}
           className="h-9 rounded-md bg-white/20 px-4 text-white hover:bg-white/30 transition-colors flex items-center gap-2"
         >
           <RotateCcw className="h-4 w-4" />
           Reset Filters
        </button>
      )}

      <select
           value={filterSloc}
           onChange={(e) => setFilterSloc(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="" className="text-black">All Locations</option>  {/*Default*/}
           {slocs.map((s) => (
             <option key={s.slocId} value={s.slocName} className="text-black">
               {s.slocName}
             </option>
           ))}
         </select>
      
      <select
           value={filterHolder}
           onChange={(e) => setFilterHolder(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="" className="text-black">All Holders</option>  {/*Default*/}
           {ihs.map((h) => (
             <option key={h.ihId} value={h.ihName} className="text-black">
               {h.ihName}
             </option>
           ))}
         </select>

      <select
           value={sortOption}
           onChange={(e) => setSortOption(e.target.value as SortOption)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="name" className="text-black">Sort by Item Name</option>
           <option value="quantity" className="text-black">Sort by Quantity</option>
         </select>
      
        {/*Asc/Desc Button*/}
         <button
           onClick={() => {
             setSortAsc(!sortAsc);
           }}
           className="h-9 rounded-md bg-white/20 px-4 text-white hover:bg-white/30 transition-colors"
         >
           {sortAsc ? "▲" : "▼"}
         </button>
       </div>
      </div>
     

      {items.length === 0 && !loading ? (
        <div className="py-16 text-center text-white/80">
          <p className="mb-2 text-xl">No items found</p>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="flex flex-col rounded-lg bg-white p-6"
            >
              {/*Display Image*/}
              <div className="relative w-full">
                <div className="absolute top-8 right-0 h-32 w-32 bg-gray-100 flex items-center justify-center rounded-bl-lg overflow-hidden">
                  {item.itemImage ? (
                    <img
                    src={item.itemImage}
                    alt={item.itemDesc}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>  
                  )}
                </div>
              </div>

              <h3 className="mb-3 text-center text-xl font-bold text-gray-900">
                {item.itemDesc}
              </h3>
              <div className="mb-4 flex-1 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">NUSC SN:</span> {item.nuscSn}
                </p>
                <p>
                  <span className="font-semibold">Quantity:</span> {item.itemQty}{" "}
                  {item.itemUom}
                </p>
                <p>
                  <span className="font-semibold">Storage Location:</span>{" "}
                  {item.sloc.slocName}  
                </p>
                <p>
                  <span className="font-semibold">Inventory Holder:</span>{" "}
                  {item.ih.ihName}
                </p>
                {item.itemRemarks && (
                  <p className="mt-3 text-xs leading-relaxed text-[#A1A1A1]">
                    {item.itemRemarks}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <EditItemModal
                  slocs={slocs}
                  ihs={ihs}
                  mode="edit"
                  item={{
                    itemId: item.itemId,
                    nuscSn: item.nuscSn,
                    itemDesc: item.itemDesc,
                    itemQty: item.itemQty,
                    itemUom: item.itemUom,
                    itemSloc: item.itemSloc,
                    itemIh: item.itemIh,
                    itemRemarks: item.itemRemarks,
                    itemPurchaseDate: item.itemPurchaseDate,
                    itemRfpNumber: item.itemRfpNumber,
                    itemImage: item.itemImage,
                  }}
                />
                <DeleteItemButton
                  itemId={Number(item.itemId)}
                  itemDesc={item.itemDesc}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {page < totalPages && (
        <div className="mt-6 flex justify-center">
          <button
          type="button"
          onClick={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchItems(nextPage);
          }}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>      
      )}
    </div>
  );
}
