"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createItem, updateItem } from "@/lib/actions/item";
import { Plus } from "lucide-react";
import type { SlocView, IHView } from "@/lib/utils/server/item";
import type { Prisma } from "@prisma/client";

type ItemForEdit = Prisma.ItemGetPayload<{
  select: {
    itemId: true;
    itemDesc: true;
    itemQty: true;
    itemUom: true;
    itemSloc: true;
    itemIh: true;
    itemRemarks: true;
    itemPurchaseDate: true;
    itemRfpNumber: true;
    itemImage: true;
  };
}>;

interface EditItemModalProps {
  slocs: SlocView[];
  ihs: IHView[];
  item?: ItemForEdit;
  mode?: "add" | "edit";
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FieldErrors {
  itemId?: string;
  itemDesc?: string;
  itemQty?: string;
  itemUom?: string;
  itemSloc?: string;
  itemIh?: string;
}

export default function EditItemModal({
  slocs,
  ihs,
  item,
  mode = "add",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditItemModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [itemSloc, setItemSloc] = useState(item?.itemSloc || "");
  const [itemIh, setItemIh] = useState(item?.itemIh || "");
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setItemSloc(item.itemSloc);
      setItemIh(item.itemIh);
    } else {
      setItemSloc("");
      setItemIh("");
    }
  }, [item]);

  function parseErrorToField(error: string): FieldErrors {
    const errors: FieldErrors = {};
    
    if (error.includes("Item ID")) {
      if (error.includes("already exists")) {
        errors.itemId = error;
      } else {
        errors.itemId = "Item ID is required";
      }
    } else if (error.includes("Description")) {
      errors.itemDesc = "Description is required";
    } else if (error.includes("Quantity")) {
      errors.itemQty = error.includes("valid") 
        ? "Quantity must be a valid positive number"
        : "Quantity is required";
    } else if (error.includes("Unit of Measure")) {
      errors.itemUom = "Unit of Measure is required";
    } else if (error.includes("Storage Location")) {
      errors.itemSloc = "Storage Location is required";
    } else if (error.includes("Inventory Holder")) {
      errors.itemIh = "Inventory Holder is required";
    }
    
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFieldErrors({});
    
    const errors: FieldErrors = {};
    const itemId = formData.get("itemId") as string;
    const itemDesc = formData.get("itemDesc") as string;
    const itemQty = formData.get("itemQty") as string;
    const itemUom = formData.get("itemUom") as string;

    // Validate all required fields
    if (!itemId || itemId.trim() === "") {
      errors.itemId = "Item ID is required";
    }
    if (!itemDesc || itemDesc.trim() === "") {
      errors.itemDesc = "Description is required";
    }
    if (!itemQty || itemQty.trim() === "") {
      errors.itemQty = "Quantity is required";
    }
    if (!itemUom || itemUom.trim() === "") {
      errors.itemUom = "Unit of Measure is required";
    }
    if (!itemSloc || itemSloc.trim() === "") {
      errors.itemSloc = "Storage Location is required";
    }
    if (!itemIh || itemIh.trim() === "") {
      errors.itemIh = "Inventory Holder is required";
    }

    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    // Add the select values to formData
    formData.append("itemSloc", itemSloc);
    formData.append("itemIh", itemIh);
    
    const result = mode === "edit" && item
      ? await updateItem(item.itemId, formData)
      : await createItem(formData);
    
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Item ${mode === "edit" ? "updated" : "created"} successfully!`);
      setOpen(false);
      setItemSloc("");
      setItemIh("");
      setFieldErrors({});
      router.refresh();
    } else {
      const serverErrors = parseErrorToField(result.error || `Failed to ${mode === "edit" ? "update" : "create"} item`);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        toast.error(result.error || `Failed to ${mode === "edit" ? "update" : "create"} item`);
      }
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      if (item) {
        setItemSloc(item.itemSloc);
        setItemIh(item.itemIh);
      } else {
        setItemSloc("");
        setItemIh("");
      }
      setFieldErrors({});
    }
  };

  // Format date for input field
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const defaultTrigger = mode === "add" ? (
    <Button className="bg-[#FF7D4E] hover:bg-[#FF7D4E]/90 text-white">
      <Plus className="h-4 w-4" />
      Add Item
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      Edit
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Update the details of this item."
                : "Fill in the details to add a new item to the catalogue."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemId">NUSC SN *</Label>
              <Input
                id="itemId"
                name="itemId"
                placeholder="Enter NUSC serial number"
                defaultValue={item?.itemId || ""}
                className={fieldErrors.itemId ? "border-red-500" : ""}
                onChange={() => {
                  if (fieldErrors.itemId) {
                    setFieldErrors({ ...fieldErrors, itemId: undefined });
                  }
                }}
              />
              {fieldErrors.itemId && (
                <p className="text-sm text-red-600">{fieldErrors.itemId}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemDesc">Description *</Label>
              <Input
                id="itemDesc"
                name="itemDesc"
                placeholder="Enter item description"
                defaultValue={item?.itemDesc || ""}
                className={fieldErrors.itemDesc ? "border-red-500" : ""}
                onChange={() => {
                  if (fieldErrors.itemDesc) {
                    setFieldErrors({ ...fieldErrors, itemDesc: undefined });
                  }
                }}
              />
              {fieldErrors.itemDesc && (
                <p className="text-sm text-red-600">{fieldErrors.itemDesc}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemQty">Quantity *</Label>
                <Input
                  id="itemQty"
                  name="itemQty"
                  type="number"
                  placeholder="0"
                  defaultValue={item?.itemQty || ""}
                  className={fieldErrors.itemQty ? "border-red-500" : ""}
                  onChange={() => {
                    if (fieldErrors.itemQty) {
                      setFieldErrors({ ...fieldErrors, itemQty: undefined });
                    }
                  }}
                />
                <p className="text-sm text-red-600 min-h-[20px]">
                  {fieldErrors.itemQty || "\u00A0"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemUom">Unit of Measure *</Label>
                <Input
                  id="itemUom"
                  name="itemUom"
                  placeholder="e.g., pcs, kg, m"
                  defaultValue={item?.itemUom || ""}
                  className={fieldErrors.itemUom ? "border-red-500" : ""}
                  onChange={() => {
                    if (fieldErrors.itemUom) {
                      setFieldErrors({ ...fieldErrors, itemUom: undefined });
                    }
                  }}
                />
                <p className="text-sm text-red-600 min-h-[20px]">
                  {fieldErrors.itemUom || "\u00A0"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemSloc">Storage Location *</Label>
                <Select 
                  value={itemSloc} 
                  onValueChange={(value) => {
                    setItemSloc(value);
                    if (fieldErrors.itemSloc) {
                      setFieldErrors({ ...fieldErrors, itemSloc: undefined });
                    }
                  }}
                >
                  <SelectTrigger 
                    id="itemSloc"
                    className={fieldErrors.itemSloc ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {slocs.map((sloc) => (
                      <SelectItem key={sloc.slocId} value={sloc.slocId}>
                        {sloc.slocName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-red-600 min-h-[20px]">
                  {fieldErrors.itemSloc || "\u00A0"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemIh">Inventory Holder *</Label>
                <Select 
                  value={itemIh} 
                  onValueChange={(value) => {
                    setItemIh(value);
                    if (fieldErrors.itemIh) {
                      setFieldErrors({ ...fieldErrors, itemIh: undefined });
                    }
                  }}
                >
                  <SelectTrigger 
                    id="itemIh"
                    className={fieldErrors.itemIh ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select holder" />
                  </SelectTrigger>
                  <SelectContent>
                    {ihs.map((ih) => (
                      <SelectItem key={ih.ihId} value={ih.ihId}>
                        {ih.ihName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-red-600 min-h-[20px]">
                  {fieldErrors.itemIh || "\u00A0"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="itemPurchaseDate">Purchase Date</Label>
                <Input
                  id="itemPurchaseDate"
                  name="itemPurchaseDate"
                  type="date"
                  defaultValue={formatDateForInput(item?.itemPurchaseDate || null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemRfpNumber">RFP Number</Label>
                <Input
                  id="itemRfpNumber"
                  name="itemRfpNumber"
                  placeholder="Enter RFP number"
                  defaultValue={item?.itemRfpNumber || ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemImage">Image URL</Label>
              <Input
                id="itemImage"
                name="itemImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                defaultValue={item?.itemImage || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemRemarks">Remarks</Label>
              <Textarea
                id="itemRemarks"
                name="itemRemarks"
                placeholder="Enter any additional remarks"
                rows={3}
                defaultValue={item?.itemRemarks || ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "edit"
                  ? "Updating..."
                  : "Adding..."
                : mode === "edit"
                ? "Update Item"
                : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
