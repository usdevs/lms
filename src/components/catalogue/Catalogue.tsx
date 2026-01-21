"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, RotateCcw, X, Pencil, Ban, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ItemFormModal from "./ItemFormModal";
import DeleteItemButton from "./DeleteItemButton";
import { getItemsPaginated } from "@/lib/actions/item";
import { IHView } from "@/lib/types/ih";
import { EnrichedItemView } from "@/lib/types/items";
import { SlocView } from "@/lib/types/slocs";
import { DashboardNav } from "@/components/DashboardNav";

interface CatalogueProps {
  slocs: SlocView[];
  ihs: IHView[];
}

type SortOption = "name" | "quantity" | "id";

export default function Catalogue({ slocs, ihs }: CatalogueProps) {
  // Filters and Sort (server-side)
  const [searchString, setSearchString] = useState("");
  const [filterSlocId, setFilterSlocId] = useState<string>("");
  const [filterIhId, setFilterIhId] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [items, setItems] = useState<EnrichedItemView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 28;
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(
    async (pageNum: number, resetItems = false) => {
      setLoading(true);
      try {
        const response = await getItemsPaginated({
          page: pageNum,
          limit: limit,
          sort: sortOption,
          asc: sortAsc,
          search: searchString || undefined,
          slocId: filterSlocId || undefined,
          ihId: filterIhId || undefined,
        });

        if (resetItems) {
          setItems(response.data);
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((item: EnrichedItemView) => item.itemId));
            const newItems = response.data.filter((item: EnrichedItemView) => !existingIds.has(item.itemId));
            return [...prev, ...newItems];
          });
        }
        setTotalPages(response.meta.totalPages);
        setTotalItems(response.meta.totalItems);
      } catch (err) {
        console.error("Failed to fetch items", err);
      } finally {
        setLoading(false);
      }
    },
    [searchString, filterSlocId, filterIhId, sortOption, sortAsc, limit]
  );

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset and refetch when filters, sort, or searchString changes
  // This auto-fetches on any filter change (filterSlocId, filterIhId, sortOption, sortAsc)
  // and also when searchString changes (which happens on Enter/blur)
  useEffect(() => {
    setPage(1);
    setItems([]);
    setTotalItems(0);
    fetchItems(1, true);
  }, [fetchItems]);

  // Infinite scroll: auto-load when scrolling near bottom
  useEffect(() => {
    if (page >= totalPages || loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage);
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before reaching the sentinel
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [page, totalPages, loading, fetchItems]);

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
    filterSlocId: "",
    filterIhId: "",
    sortOption: "name" as SortOption,
    sortAsc: true,
  };
  const resetFilters = () => {
    setFilterSlocId(defaultFilters.filterSlocId);
    setFilterIhId(defaultFilters.filterIhId);
    setSortOption(defaultFilters.sortOption);
    setSortAsc(defaultFilters.sortAsc);
  };

  // Check if any filter is not in default state
  const hasActiveFilters = 
    filterSlocId !== defaultFilters.filterSlocId ||
    filterIhId !== defaultFilters.filterIhId ||
    sortOption !== defaultFilters.sortOption ||
    sortAsc !== defaultFilters.sortAsc;

  // Refresh items after create/update/delete (preserves current filters)
  const refreshItems = useCallback(() => {
    setPage(1);
    setItems([]);
    fetchItems(1, true);
  }, [fetchItems]);

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-8">
      <DashboardNav />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Catalogue</h1>
          <p className="text-white/80">{totalItems} ITEMS</p>
        </div>
        <ItemFormModal slocs={slocs} ihs={ihs} mode="add" onSuccess={refreshItems} />
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
           value={filterSlocId}
           onChange={(e) => setFilterSlocId(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="" className="text-black">All Locations</option>  {/*Default*/}
           {slocs.map((s) => (
             <option key={s.slocId} value={s.slocId} className="text-black">
               {s.slocName}
             </option>
           ))}
         </select>
      
      <select
           value={filterIhId}
           onChange={(e) => setFilterIhId(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="" className="text-black">All Holders</option>  {/*Default*/}
           {ihs.map((h) => (
             <option key={h.ihId} value={h.ihId} className="text-black">
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
           <option value="id" className="text-black">Sort by ID</option>
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
      ) : items.length === 0 && loading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="size-8 text-white/60" />
            <p className="text-white/60">Loading items...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="group relative flex flex-col rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image with hover action buttons */}
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                {item.itemImage ? (
                  <img
                    src={item.itemImage}
                    alt={item.itemDesc}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
                
                {/* Action buttons - appear on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ItemFormModal
                    slocs={slocs}
                    ihs={ihs}
                    mode="edit"
                    item={{
                      itemId: item.itemId,
                      itemDesc: item.itemDesc,
                      itemQty: item.itemQty,
                      itemUom: item.itemUom,
                      itemSloc: item.itemSloc,
                      itemIh: item.itemIh,
                      itemRemarks: item.itemRemarks,
                      itemPurchaseDate: item.itemPurchaseDate,
                      itemRfpNumber: item.itemRfpNumber,
                      itemImage: item.itemImage,
                      itemUnloanable: item.itemUnloanable,
                      itemExpendable: item.itemExpendable,
                    }}
                    trigger={
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                    onSuccess={refreshItems}
                  />
                  <DeleteItemButton
                    itemId={Number(item.itemId)}
                    itemDesc={item.itemDesc}
                    onDelete={refreshItems}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                {/* Item type badges */}
                {(item.itemUnloanable || item.itemExpendable) && (
                  <div className="flex gap-1.5 mb-2">
                    {item.itemUnloanable && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                        <Ban className="h-3 w-3" />
                        Unloanable
                      </span>
                    )}
                    {item.itemExpendable && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                        <Package className="h-3 w-3" />
                        Expendable
                      </span>
                    )}
                  </div>
                )}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                  {item.itemDesc}
                </h3>
                
                <div className="text-xs text-gray-500 space-y-0.5 mb-4">
                  <p className="truncate">{item.sloc.slocName}</p>
                  <p className="truncate">
                    {item.ih.ihName}
                    {item.ih.members?.[0]?.user?.telegramHandle && (
                      <span className="text-gray-400"> (@{item.ih.members[0].user.telegramHandle})</span>
                    )}
                  </p>
                </div>

                {/* Quantity - simplified inline format */}
                <div className="flex items-baseline gap-1.5 mt-auto">
                  <span className={cn(
                    "text-xl font-semibold",
                    item.availableQty > 0 ? "text-green-600" : "text-destructive"
                  )}>
                    {item.availableQty}
                  </span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-gray-600 text-sm">{item.totalQty}</span>
                  <span className="text-gray-400 text-xs ml-1">available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel - triggers loading when scrolled into view */}
      {/* Only show sentinel when we have items (not during initial load/filter reset) */}
      {items.length > 0 && page < totalPages && (
        <div ref={sentinelRef} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="flex items-center gap-3">
              <Spinner className="size-5 text-white/60" />
              <p className="text-white/60">Loading more items...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
