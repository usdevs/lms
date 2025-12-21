"use client";

import { ChangeEvent, useState, useEffect, lazy } from "react";
import { Edit, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import EditItemModal from "./EditItemModal";
import DeleteItemButton from "./DeleteItemButton";
import type { ItemView, SlocView, IHView } from "@/lib/utils/server/item";

interface CatalogueProps {
  slocs: SlocView[];
  ihs: IHView[];
}

export default function Catalogue({ slocs, ihs }: CatalogueProps) {
  const [searchString, setSearchString] = useState("");
  // Pagination 
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 27; 
  const [loading, setLoading] = useState(false);

  const fetchItems = async(page: number) => { 
    setLoading(true);
    try {
      const res = await fetch(`/api/items/upload?page=${page}`);
      const data = await res.json();

      setItems((prev) => [...prev, ...data.items]);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect( () => {
    fetchItems(1); // Load first page automatically
  }, []);

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
  const [filterSloc, setFilterSloc] = useState<string>("");
  const [filterHolder, setFilterHolder] = useState<string>("");

  const filteredItems = items.filter(
    (item) => {
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

      <select
           value={filterSloc}
           onChange={(e) => setFilterSloc(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="">All Locations</option>  {/*Default*/}
           {slocs.map((s) => (
             <option key={s.slocId} value={s.slocName}>
               {s.slocName}
             </option>
           ))}
         </select>

      <select
           value={filterHolder}
           onChange={(e) => setFilterHolder(e.target.value)}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="">All Holders</option>  {/*Default*/}
           {ihs.map((h) => (
             <option key={h.ihId} value={h.ihName}>
               {h.ihName}
             </option>
           ))}
         </select>

      <select
           value={sortOption}
           onChange={onSortChange}
           className="h-9 rounded-md bg-white/20 px-3 text-white border border-white/20 focus:outline-none"
         >
           <option value="name">Sort by Item Name</option>
           <option value="quantity">Sort by Quantity</option>
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
          )
      }  

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