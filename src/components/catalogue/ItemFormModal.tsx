"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createItem, updateItem, uploadItemImage } from "@/lib/actions/item";
import { createSloc } from "@/lib/actions/sloc";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { SlocSelector, SlocSelectorValue, NewSlocDetails } from "./SlocSelector";
import { IHSelector } from "./IHSelector";

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
      itemUnloanable: true;
      itemExpendable: true;
    };
  }>;

interface ItemFormModalProps {
  slocs: SlocView[];
  ihs: IHView[];
  item?: ItemForEdit;
  mode?: "add" | "edit";
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ItemFormModal({
  slocs,
  ihs,
  item,
  mode = "add",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: ItemFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.itemImage ?? null);
  const [shouldDeleteOldImage, setShouldDeleteOldImage] = useState(false);
  // Track the original image URL so we can delete it when replacing
  const originalImageUrl = item?.itemImage ?? null;

  // Local state for slocs (to support inline creation)
  const [localSlocs, setLocalSlocs] = useState(slocs);
  // New SLOC creation state
  const [newSlocDetails, setNewSlocDetails] = useState<NewSlocDetails>({ slocName: "" });
  const [slocSelectorValue, setSlocSelectorValue] = useState<SlocSelectorValue>(item?.itemSloc ?? undefined);

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
      itemUnloanable: item?.itemUnloanable ?? false,
      itemExpendable: item?.itemExpendable ?? false,
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

    // Handle new SLOC creation if needed
    let finalSlocId = values.itemSloc as string;
    if (slocSelectorValue === "new") {
      if (!newSlocDetails.slocName.trim()) {
        toast.error("Please enter a location name");
        setIsSubmitting(false);
        return;
      }
      const slocResult = await createSloc({ slocName: newSlocDetails.slocName.trim() });
      if (!slocResult.success) {
        toast.error(slocResult.error || "Failed to create location");
        setIsSubmitting(false);
        return;
      }
      finalSlocId = slocResult.data.slocId;
      // Add to local slocs for future use
      setLocalSlocs(prev => [...prev, slocResult.data]);
    }

    let photoUrl: string | null = null;
    
    // Upload new image if selected
    if (selectedFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("photo", selectedFile);

      const uploadResult = await uploadItemImage(uploadFormData);
      if ("url" in uploadResult && uploadResult.url) {
        photoUrl = uploadResult.url;
      } else if ("error" in uploadResult) {
        toast.error(uploadResult.error || "Failed to upload image");
        setIsSubmitting(false);
        return;
      }
    } else if (!shouldDeleteOldImage && originalImageUrl) {
      // Keep existing image if not deleted and no new file
      photoUrl = originalImageUrl;
    }

    // Build final values
    const finalValues: Record<string, unknown> = {
      ...values,
      itemSloc: finalSlocId,
      // Set itemImage: if we have a new photo use it, if deleting use empty string to signal clear
      itemImage: photoUrl ?? (shouldDeleteOldImage ? "" : undefined),
    };
    
    // Add delete flag and old image URL if we need to delete the old image
    // This happens when: 1) User explicitly deleted, or 2) User replaced with new image
    if (shouldDeleteOldImage && originalImageUrl) {
      finalValues.deleteImage = true;
      finalValues.oldImageUrl = originalImageUrl;
    }
    
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
      // Reset SLOC creation state
      setNewSlocDetails({ slocName: "" });
      setSlocSelectorValue(undefined);
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
      setShouldDeleteOldImage(false);
      setLocalSlocs(slocs);
      setNewSlocDetails({ slocName: "" });
      setSlocSelectorValue(item?.itemSloc ?? undefined);
    }
  };

  // Handle SLOC selector change
  const handleSlocChange = (val: SlocSelectorValue) => {
    setSlocSelectorValue(val);
    if (val && val !== "new") {
      form.setValue("itemSloc", val);
      form.clearErrors("itemSloc");
    } else if (val === "new") {
      // Set placeholder to pass validation - will be replaced with actual ID on submit
      form.setValue("itemSloc", "__new__");
      form.clearErrors("itemSloc");
    } else {
      form.setValue("itemSloc", "");
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                  render={() => (
                    <FormItem>
                      <FormLabel>Storage Location *</FormLabel>
                      <FormControl>
                        <SlocSelector
                          slocs={localSlocs}
                          value={slocSelectorValue}
                          onChange={handleSlocChange}
                          onNewDetailsChange={setNewSlocDetails}
                          errors={{
                            sloc: form.formState.errors.itemSloc?.message,
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemIh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Holder *</FormLabel>
                      <FormControl>
                        <IHSelector
                          ihs={ihs}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            if (val) form.clearErrors("itemIh");
                          }}
                          error={form.formState.errors.itemIh?.message}
                        />
                      </FormControl>
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
                render={() => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={previewUrl}
                        onChange={(file) => {
                          setSelectedFile(file);
                          if (file) {
                            setPreviewUrl(URL.createObjectURL(file));
                            // Mark for deletion if there was an original image
                            if (originalImageUrl) {
                              setShouldDeleteOldImage(true);
                            }
                          }
                        }}
                        onDelete={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          // Mark original image for deletion
                          if (originalImageUrl) {
                            setShouldDeleteOldImage(true);
                          }
                        }}
                        disabled={isSubmitting}
                      />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemUnloanable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Unloanable
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This item cannot be loaned out
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="itemExpendable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Expendable
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Item is consumed when loaned (not returned)
                        </p>
                      </div>
                    </FormItem>
                  )}
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
