"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Star, UserMinus, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
import { cn } from "@/lib/utils";
import { removeUserFromGroup, setPrimaryPOC, addUserToGroup } from "@/lib/actions/user";
import { UserWithDetails, GroupIHWithMembers } from "@/lib/types/user";

interface GroupsViewProps {
    groups: GroupIHWithMembers[];
    users: UserWithDetails[];
    onRefresh?: () => void;
}

export function GroupsView({ groups, users, onRefresh }: GroupsViewProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const toggleGroup = (ihId: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(ihId)) {
                next.delete(ihId);
            } else {
                next.add(ihId);
            }
            return next;
        });
    };

    const handleRemoveMember = (userId: number, ihId: string, userName: string) => {
        startTransition(async () => {
            const result = await removeUserFromGroup(userId, ihId);
            if (result.success) {
                toast.success(`${userName} removed from group`);
                onRefresh?.();
            } else {
                toast.error(result.error || "Failed to remove member");
            }
        });
    };

    const handleSetPrimary = (ihId: string, userId: number, userName: string) => {
        startTransition(async () => {
            const result = await setPrimaryPOC(ihId, userId);
            if (result.success) {
                toast.success(`${userName} set as primary POC`);
                onRefresh?.();
            } else {
                toast.error(result.error || "Failed to set primary POC");
            }
        });
    };

    const handleAddMember = (userId: number, ihId: string) => {
        startTransition(async () => {
            const result = await addUserToGroup(userId, ihId, false);
            if (result.success) {
                toast.success("Member added to group");
                onRefresh?.();
            } else {
                toast.error(result.error || "Failed to add member");
            }
        });
    };

    const getAvailableUsersForGroup = (group: GroupIHWithMembers) => {
        const memberIds = new Set(group.members.map((m) => m.userId));
        return users.filter((u) => !memberIds.has(u.userId));
    };

    if (groups.length === 0) {
        return (
            <div className="py-16 text-center text-white/80">
                <p className="mb-2 text-xl">No groups found</p>
                <p>Create a group when adding or editing a user</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.ihId);
                const primaryMember = group.members.find((m) => m.isPrimary);
                const availableUsers = getAvailableUsersForGroup(group);

                return (
                    <div
                        key={group.ihId}
                        className="rounded-lg border bg-white overflow-hidden"
                    >
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(group.ihId)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">{group.ihName}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {group.ihType}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                {primaryMember && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {primaryMember.user.firstName}
                                        {primaryMember.user.lastName ? ` ${primaryMember.user.lastName}` : ""}
                                    </span>
                                )}
                                <Badge variant="secondary">
                                    {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t">
                                {/* Add Member Button */}
                                <div className="p-3 border-b bg-muted/30">
                                    <AddMemberPopover
                                        availableUsers={availableUsers}
                                        onAddMember={(userId) => handleAddMember(userId, group.ihId)}
                                        disabled={isPending || availableUsers.length === 0}
                                    />
                                </div>

                                {/* Members List */}
                                {group.members.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        No members in this group
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {group.members.map((member) => {
                                            const fullName = `${member.user.firstName}${member.user.lastName ? ` ${member.user.lastName}` : ""}`;
                                            
                                            return (
                                                <div
                                                    key={member.userId}
                                                    className="flex items-center justify-between p-3 hover:bg-muted/30"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {fullName}
                                                                </span>
                                                                {member.isPrimary && (
                                                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                                        <Star className="h-3 w-3 mr-1 fill-yellow-600" />
                                                                        Primary POC
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                @{member.user.telegramHandle}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {/* Set as Primary Button */}
                                                        {!member.isPrimary && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSetPrimary(group.ihId, member.userId, fullName)}
                                                                disabled={isPending}
                                                                title="Set as Primary POC"
                                                                className="text-muted-foreground hover:text-yellow-600"
                                                            >
                                                                <Star className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Remove from Group */}
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    disabled={isPending}
                                                                    title="Remove from group"
                                                                >
                                                                    <UserMinus className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Remove from Group
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Remove <strong>{fullName}</strong> from{" "}
                                                                        <strong>{group.ihName}</strong>? This
                                                                        will not delete the user.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() =>
                                                                            handleRemoveMember(
                                                                                member.userId,
                                                                                group.ihId,
                                                                                fullName
                                                                            )
                                                                        }
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Remove
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Add Member Popover Component
function AddMemberPopover({
    availableUsers,
    onAddMember,
    disabled,
}: {
    availableUsers: UserWithDetails[];
    onAddMember: (userId: number) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="w-full"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                    {availableUsers.length === 0 && " (No available users)"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                            {availableUsers.map((user) => {
                                const fullName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
                                return (
                                    <CommandItem
                                        key={user.userId}
                                        value={`${fullName} ${user.telegramHandle}`}
                                        onSelect={() => {
                                            onAddMember(user.userId);
                                            setOpen(false);
                                        }}
                                    >
                                        <div>
                                            <div className="font-medium">{fullName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                @{user.telegramHandle}
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
