"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createItem, updateItem, uploadItemImage } from "@/lib/actions/item";
import { objectToFormData } from "@/lib/utils";
import {
  EditItemClientSchema,
  NewItemClientSchema,
} from "@/lib/schema/item";
import { Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { Prisma } from "@prisma/client";
import { IHView } from "@/lib/types/ih";
import { SlocView } from "@/lib/types/slocs";

type ItemForEdit =
  Prisma.ItemGetPayload<{
    select: {
      itemId: true; // internal numeric ID, not editable
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
  onSuccess?: () => void;
}

export default function EditItemModal({
  slocs,
  ihs,
  item,
  mode = "add",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: EditItemModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File |null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.itemImage ?? null);
  const [deleteImage, setDeleteImage] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;

  const defaultValues = useMemo(
    () => ({
      itemId: item?.itemId, // Needed to submit form  
      itemDesc: item?.itemDesc ?? "",
      // Let Zod coerce quantity from string; default to empty string in the input
      itemQty: item?.itemQty ?? undefined,
      itemUom: item?.itemUom ?? "",
      itemSloc: item?.itemSloc ?? "",
      itemIh: item?.itemIh ?? "",
      itemRemarks: item?.itemRemarks ?? undefined,
      itemPurchaseDate: item?.itemPurchaseDate ?? undefined,
      itemRfpNumber: item?.itemRfpNumber ?? undefined,
      itemImage: item?.itemImage ?? undefined, 
    }),
    [item],
  );

  const form = useForm({
    resolver: zodResolver(
      mode === "edit" ? EditItemClientSchema : NewItemClientSchema,
    ),
    defaultValues,
  });

  // Keep form in sync when editing a different item
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  async function onSubmit(values: Record<string, unknown>) {
    setIsSubmitting(true);

    let photoUrl = item?.itemImage ?? null;
    
    if (selectedFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("photo", selectedFile);

      const uploadResult = await uploadItemImage(uploadFormData);
      if ("url" in uploadResult && uploadResult.url) {
        const origin = window.location.origin;
        photoUrl = `${origin}${uploadResult.url}`;  // Valid Url
      } else if ("error" in uploadResult) {
        toast.error(uploadResult.error || "Failed to upload image");
        setIsSubmitting(false);
        return;
      }
    } 

    const finalValues = {...values, ...(photoUrl ? { itemImage: photoUrl } : ""), ...(deleteImage ? {deleteImage: true } : {})};
    const formData = objectToFormData(finalValues);

    const result =
      mode === "edit" && item
        ? await updateItem(Number(item.itemId), formData)
        : await createItem(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(
        `Item ${mode === "edit" ? "updated" : "created"} successfully!`,
      );
      setOpen(false);
      onSuccess?.();
      return;
    }

    const errorMessage =
      result.error ||
      `Failed to ${mode === "edit" ? "update" : "create"} item`;

    // Map known server-side validation errors to fields where possible
    if (errorMessage.includes("Description")) {
      form.setError("itemDesc", { message: errorMessage });
    } else if (errorMessage.includes("Quantity")) {
      form.setError("itemQty", { message: errorMessage });
    } else if (errorMessage.includes("Unit of Measure")) {
      form.setError("itemUom", { message: errorMessage });
    } else if (errorMessage.includes("Storage Location")) {
      form.setError("itemSloc", { message: errorMessage });
    } else if (errorMessage.includes("Inventory Holder")) {
      form.setError("itemIh", { message: errorMessage });
    } else {
      toast.error(errorMessage);
    }
  }
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      form.reset(defaultValues);
      setSelectedFile(null);
      setPreviewUrl(item?.itemImage ?? null);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {mode === "edit" ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                {mode === "edit"
                  ? "Update the details of this item."
                  : "Fill in the details to add a new item to the catalogue."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              <FormField
                control={form.control}
                name="itemDesc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter item description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={(field.value as string | number | readonly string[] | undefined) ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="itemUom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., pcs, kg, m"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemSloc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="itemSloc">Storage Location *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="itemSloc">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {slocs.map((sloc) => (
                              <SelectItem
                                key={sloc.slocId}
                                value={sloc.slocId}
                              >
                                {sloc.slocName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="itemIh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="itemIh">Inventory Holder *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="itemIh">
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemPurchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? formatDateForInput(field.value as Date) : ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="itemRfpNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFP Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter RFP number"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="itemImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="itemImage">Upload Image</FormLabel> 
                    <FormControl>
                      <Input
                        id="itemImage" 
                        type="file" 
                        accept="image/"
                        onChange={ (e) => {
                          const file = e.target.files?.[0] ?? null;
                          setSelectedFile(file);
                          setPreviewUrl(file ? URL.createObjectURL(file) : item?.itemImage ?? null);
                        }}
                        className="border rounded-md p-1" 
                      />
                      {previewUrl && (
                        <div className="flex items-end gap-2 mt-2">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="bg-[#0d0a03] hover:bg-[#64615c] text-white"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(null);
                              field.onChange("");
                              setDeleteImage(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional remarks"
                        rows={3}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    <span>{mode === "edit" ? "Updating..." : "Adding..."}</span>
                  </div>
                ) : (
                  <span>{mode === "edit" ? "Update Item" : "Add Item"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
