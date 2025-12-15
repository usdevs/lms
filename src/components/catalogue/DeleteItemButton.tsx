"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteItem } from "@/lib/actions/item";

interface DeleteItemButtonProps {
  itemId: string;
  itemDesc: string;
  onDelete?: () => void;
}

export default function DeleteItemButton({
  itemId,
  itemDesc,
}: DeleteItemButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleDelete() {
    // Optimistic update - remove from UI immediately

    // Perform actual deletion in background
    const result = await deleteItem(itemId);

    setOpen(false);

    if (result.success) {
      toast.success("Item deleted successfully!");
      // Use startTransition for non-blocking refresh
      startTransition(() => {
        router.refresh();
      });
    } else {
      toast.error(result.error || "Failed to delete item");
      // If deletion failed, refresh to restore the item
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-auto text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{itemDesc}</strong> (ID:{" "}
            {itemId})? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

