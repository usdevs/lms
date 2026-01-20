"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserFormModal } from "./UserFormModal";
import { deleteUser } from "@/lib/actions/user";
import { UserWithDetails, GroupIHWithMembers } from "@/lib/types/user";

interface UsersTableProps {
    users: UserWithDetails[];
    groups: GroupIHWithMembers[];
    onRefresh?: () => void;
}

const roleColors: Record<string, string> = {
    REQUESTER: "bg-gray-100 text-gray-800",
    IH: "bg-blue-100 text-blue-800",
    LOGS: "bg-green-100 text-green-800",
};

export function UsersTable({ users, groups, onRefresh }: UsersTableProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (userId: number) => {
        setIsDeleting(true);
        const result = await deleteUser(userId);
        setIsDeleting(false);

        if (result.success) {
            setDeleteDialogOpen(false);
            setDeletingId(null);
            toast.success("User deleted successfully");
            onRefresh?.();
        } else {
            toast.error(result.error || "Failed to delete user");
        }
    };

    const getFullName = (user: UserWithDetails) => {
        return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
    };

    const getUserGroups = (user: UserWithDetails) => {
        return user.ihMemberships
            .filter((m) => m.ih.ihType === "GROUP" || m.ih.ihType === "DEPARTMENT")
            .map((m) => ({ ihId: m.ih.ihId, ihName: m.ih.ihName }));
    };

    const hasLoans = (user: UserWithDetails) => {
        return user._count.loanRequests > 0 || user._count.handledLoans > 0;
    };

    const isIHForItems = (user: UserWithDetails) => {
        return user.ihMemberships.some(
            (m) => m.ih.ihType === "INDIVIDUAL" && m.ih._count.items > 0
        );
    };

    const canDelete = (user: UserWithDetails) => {
        return !hasLoans(user) && !isIHForItems(user);
    };

    const getDeleteDisabledReason = (user: UserWithDetails) => {
        if (hasLoans(user)) {
            return "Cannot delete user with loan history";
        }
        if (isIHForItems(user)) {
            const itemCount = user.ihMemberships
                .filter((m) => m.ih.ihType === "INDIVIDUAL")
                .reduce((sum, m) => sum + m.ih._count.items, 0);
            return `Cannot delete user: IH for ${itemCount} item(s)`;
        }
        return "Delete user";
    };

    if (users.length === 0) {
        return (
            <div className="py-16 text-center text-white/80">
                <p className="mb-2 text-xl">No users found</p>
                <p>Add a user to get started</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Telegram</TableHead>
                        <TableHead>NUSNET</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Groups</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.userId}>
                            <TableCell className="font-medium">
                                {getFullName(user)}
                            </TableCell>
                            <TableCell>
                                <span className="text-muted-foreground">@</span>
                                {user.telegramHandle}
                            </TableCell>
                            <TableCell>
                                {user.nusnetId || (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className={roleColors[user.role] || ""}
                                >
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {getUserGroups(user).length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {getUserGroups(user).slice(0, 2).map((group) => (
                                            <Badge
                                                key={group.ihId}
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {group.ihName}
                                            </Badge>
                                        ))}
                                        {getUserGroups(user).length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{getUserGroups(user).length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <UserFormModal
                                        user={user}
                                        groups={groups}
                                        mode="edit"
                                        onSuccess={onRefresh}
                                    />
                                    <TooltipProvider>
                                        <Tooltip>
                                            <AlertDialog
                                                open={deleteDialogOpen && deletingId === user.userId}
                                                onOpenChange={(open) => {
                                                    if (!isDeleting) {
                                                        setDeleteDialogOpen(open);
                                                        if (open) setDeletingId(user.userId);
                                                    }
                                                }}
                                            >
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                        <span tabIndex={canDelete(user) ? -1 : 0}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                disabled={!canDelete(user)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </span>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete{" "}
                                                            <strong>{getFullName(user)}</strong>? This action
                                                            cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                        <Button
                                                            onClick={() => handleDelete(user.userId)}
                                                            disabled={isDeleting}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            {isDeleting ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Spinner className="size-4" />
                                                                    <span>Deleting...</span>
                                                                </div>
                                                            ) : (
                                                                "Delete"
                                                            )}
                                                        </Button>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <TooltipContent>
                                                <p>{getDeleteDisabledReason(user)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
