"use client";

import { ChangeEvent, useState, useEffect } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import EditItemModal from "./EditItemModal";
import DeleteItemButton from "./DeleteItemButton";
import type { ItemView, SlocView, IHView } from "@/lib/utils/server/item";

interface CatalogueProps {
  items: ItemView[];
  slocs: SlocView[];
  ihs: IHView[];
}

export default function Catalogue({ items: initialItems, slocs, ihs }: CatalogueProps) {
  const [items, setItems] = useState(initialItems);

  // Sync items when initialItems changes (e.g., after refresh)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Sort 
  type SortOption = "name" | "quantity";
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const sortItems = (option: SortOption, asc = sortAsc) => {
    const sorted = [...items].sort((a, b) => {
      if (option === "name") {
        return asc 
          ? a.itemDesc.localeCompare(b.itemDesc)
          : b.itemDesc.localeCompare(a.itemDesc);
      }
      if (option === "quantity") {
        return asc
          ? a.itemQty - b.itemQty
          : b.itemQty - a.itemQty
      }
      return 0;
    });
    setItems(sorted);
  };

  // Dropdown
  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value as SortOption;
    setSortOption(option);
    sortItems(option);
  };
  
  // Filters
  const [searchString, setSearchString] = useState("");
  const [filterSloc, setFilterSloc] = useState<string>("");
  const [filterHolder, setFilterHolder] = useState<string>("");

  const filteredItems = items.filter( (item) => {
    const matchesSearch = 
        item.itemDesc.toLowerCase().includes(searchString.toLowerCase()) ||
        item.nuscSn.toLowerCase().includes(searchString.toLowerCase()) ||
        item.sloc.slocName.toLowerCase().includes(searchString.toLowerCase()) ||
        item.ih.ihName.toLowerCase().includes(searchString.toLowerCase()) ||
        (item.itemRemarks &&
          item.itemRemarks.toLowerCase().includes(searchString.toLowerCase()))
    
    const matchesSloc = !filterSloc || item.sloc.slocName === filterSloc;
    const matchesHolder = !filterHolder || item.ih.ihName === filterHolder;
    return matchesSearch && matchesSloc && matchesHolder; // Pass all filters 
    } 
  );

  const onInput = (ev: ChangeEvent<HTMLInputElement>) => {
    setSearchString(ev.target.value);
  };

  const defaultFilters = {
    searchString: "",
    filterSloc: "",
    filterHolder: "",
    sortOption: "name" as SortOption,
    sortAsc: true,
  };
  const resetFilters = () => {
    setSearchString(defaultFilters.searchString);
    setFilterSloc(defaultFilters.filterSloc);
    setFilterHolder(defaultFilters.filterHolder);
    setSortOption(defaultFilters.sortOption);
    setSortAsc(defaultFilters.sortAsc);
    sortItems(defaultFilters.sortOption, defaultFilters.sortAsc);
  };

  // Check if any filter is not in default state
  const hasActiveFilters = 
    searchString !== defaultFilters.searchString ||
    filterSloc !== defaultFilters.filterSloc ||
    filterHolder !== defaultFilters.filterHolder ||
    sortOption !== defaultFilters.sortOption ||
    sortAsc !== defaultFilters.sortAsc;

  return (
    <div className="min-h-screen w-full bg-[#0C2C47] p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Catalogue</h1>
          <p className="text-white/80">{filteredItems.length} ITEMS</p>
        </div>
        <EditItemModal slocs={slocs} ihs={ihs} mode="add" />
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search items by description, ID, location..."
            className="w-full pl-10 text-white placeholder:text-white/60 bg-white/10 border-white/20 focus-visible:ring-white/50"
            onChange={onInput}
            value={searchString}
          />
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
           onChange={onSortChange}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="name" className="text-black">Sort by Item Name</option>
           <option value="quantity" className="text-black">Sort by Quantity</option>
         </select>
      
        {/*Asc/Desc Button*/}
         <button
           onClick={() => {
             const nextAsc = !sortAsc;
             setSortAsc(nextAsc);
             sortItems(sortOption, nextAsc);
           }}
           className="h-9 rounded-md bg-white/20 px-4 text-white hover:bg-white/30 transition-colors"
         >
           {sortAsc ? "▲" : "▼"}
         </button>
       </div>
      </div>
     

      {filteredItems.length === 0 ? (
        <div className="py-16 text-center text-white/80">
          <p className="mb-2 text-xl">No items found</p>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.itemId}
              className="flex flex-col rounded-lg bg-white p-6"
            >
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
    </div>
  );
}
