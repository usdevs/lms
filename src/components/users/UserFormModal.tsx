"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GroupSelector } from "./GroupSelector";
import { createUser, updateUser } from "@/lib/actions/user";
import { CreateUserWithGroupsSchema, UpdateUserSchema } from "@/lib/schema/user";
import { UserWithDetails, GroupIHWithMembers } from "@/lib/types/user";

interface UserFormModalProps {
    groups: GroupIHWithMembers[];
    user?: UserWithDetails;
    mode?: "add" | "edit";
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function UserFormModal({ groups, user, mode = "add", trigger, onSuccess }: UserFormModalProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [localGroups, setLocalGroups] = useState(groups);

    // Get initial group IDs from user's memberships (for edit mode)
    const initialGroupIds = useMemo(() => {
        if (!user) return [];
        return user.ihMemberships
            .filter((m) => m.ih.ihType === "GROUP" || m.ih.ihType === "DEPARTMENT")
            .map((m) => m.ihId);
    }, [user]);

    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(initialGroupIds);

    const defaultValues = useMemo(() => ({
        userId: user?.userId,
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        telegramHandle: user?.telegramHandle ?? "",
        nusnet: user?.nusnetId ?? "",
        role: user?.role ?? UserRole.IH,
        groupIds: initialGroupIds,
    }), [user, initialGroupIds]);

    const form = useForm<z.infer<typeof UpdateUserSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(mode === "edit" ? UpdateUserSchema : CreateUserWithGroupsSchema) as any,
        defaultValues,
    });

    // Reset form when user changes (for edit mode)
    useEffect(() => {
        form.reset(defaultValues);
        setSelectedGroupIds(initialGroupIds);
    }, [defaultValues, initialGroupIds, form]);

    const onSubmit = (data: z.infer<typeof UpdateUserSchema>) => {
        startTransition(async () => {
            const payload = {
                ...data,
                groupIds: selectedGroupIds,
            };

            const result = mode === "edit" && user
                ? await updateUser(payload)
                : await createUser(payload);

            if (result.success) {
                toast.success(mode === "edit" ? "User updated successfully" : "User created successfully");
                setOpen(false);
                if (mode === "add") {
                    form.reset(defaultValues);
                    setSelectedGroupIds([]);
                }
                onSuccess?.();
            } else {
                toast.error(result.error || `Failed to ${mode === "edit" ? "update" : "create"} user`);
            }
        });
    };

    const handleGroupCreated = (newGroup: { ihId: string; ihName: string }, autoSelect: boolean) => {
        // Add to local groups list
        setLocalGroups((prev) => [
            ...prev,
            { ...newGroup, ihType: "GROUP" as const, members: [] },
        ]);
        
        // Auto-select the newly created group if requested
        if (autoSelect) {
            setSelectedGroupIds((prev) => [...prev, newGroup.ihId]);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset(defaultValues);
            setSelectedGroupIds(initialGroupIds);
            setLocalGroups(groups);
        }
    };

    const defaultTrigger = mode === "add" ? (
        <Button className="bg-[#FF7D4E] hover:bg-[#FF7D4E]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add User
        </Button>
    ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "edit" ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {mode === "edit"
                            ? "Update user details and group memberships."
                            : "Create a new user and optionally assign them to groups."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="John" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Doe" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="telegramHandle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telegram Handle *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="@username" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nusnet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NUSNET ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="E0123456" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={UserRole.REQUESTER}>Requester</SelectItem>
                                            <SelectItem value={UserRole.IH}>IH (Item Holder)</SelectItem>
                                            <SelectItem value={UserRole.LOGS}>Logs</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="border-t pt-4">
                            <GroupSelector
                                groups={localGroups}
                                selectedGroupIds={selectedGroupIds}
                                onChange={setSelectedGroupIds}
                                onGroupCreated={handleGroupCreated}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? (mode === "edit" ? "Saving..." : "Creating...")
                                    : (mode === "edit" ? "Save Changes" : "Create User")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
