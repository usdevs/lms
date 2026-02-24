"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createGroupIH, updateGroupIH } from "@/lib/actions/user";
import { CreateGroupIHSchema } from "@/lib/schema/ih";

interface GroupFormModalProps {
    group?: { ihId: string; ihName: string };
    mode?: "add" | "edit";
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

const formSchema = CreateGroupIHSchema;

export function GroupFormModal({ group, mode = "add", trigger, onSuccess }: GroupFormModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const defaultValues = useMemo(
        () => ({
            ihName: group?.ihName ?? "",
        }),
        [group?.ihName]
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        startTransition(async () => {
            const result =
                mode === "edit" && group
                    ? await updateGroupIH({ ihId: group.ihId, ihName: data.ihName.trim() })
                    : await createGroupIH({ ihName: data.ihName.trim() });

            if (result.success) {
                toast.success(mode === "edit" ? "Group renamed" : "Group created");
                setOpen(false);
                if (mode === "add") {
                    form.reset({ ihName: "" });
                }
                onSuccess?.();
            } else {
                toast.error(result.error ?? `Failed to ${mode === "edit" ? "rename" : "create"} group`);
            }
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset(defaultValues);
        }
    };

    const defaultTrigger =
        mode === "add" ? (
            <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create group
            </Button>
        ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Group">
                <Pencil className="h-4 w-4" />
            </Button>
        );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{mode === "edit" ? "Manage group" : "Create group"}</DialogTitle>
                    <DialogDescription>
                        {mode === "edit"
                            ? "Change the display name of this group"
                            : "Enter a name for the new group. You can assign users to it from their profile or from the Groups view."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="ihName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Group name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Group name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? mode === "edit"
                                        ? "Saving..."
                                        : "Creating..."
                                    : mode === "edit"
                                      ? "Save Changes"
                                      : "Create"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
