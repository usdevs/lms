"use client";

import { ChangeEvent, useState, useEffect } from "react";
import { Edit, Search } from "lucide-react";
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
  const [searchString, setSearchString] = useState("");
  const [items, setItems] = useState(initialItems);

  // Sync items when initialItems changes (e.g., after refresh)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filteredItems = items.filter(
    (item) =>
      item.itemDesc.toLowerCase().includes(searchString.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchString.toLowerCase()) ||
      item.sloc.slocName.toLowerCase().includes(searchString.toLowerCase()) ||
      item.ih.ihName.toLowerCase().includes(searchString.toLowerCase()) ||
      (item.itemRemarks &&
        item.itemRemarks.toLowerCase().includes(searchString.toLowerCase()))
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

      <div className="mb-8">
        <h3 className="mb-3 font-semibold text-white">SEARCH</h3>
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
                  <span className="font-semibold">ID:</span> {item.itemId}
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
                  itemId={item.itemId} 
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

