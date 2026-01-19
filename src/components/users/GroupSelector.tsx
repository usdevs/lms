"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroupIH } from "@/lib/actions/user";
import { GroupIHWithMembers } from "@/lib/types/user";

interface GroupSelectorProps {
    groups: GroupIHWithMembers[];
    selectedGroupIds: string[];
    onChange: (groupIds: string[]) => void;
    onGroupCreated?: (newGroup: { ihId: string; ihName: string }, autoSelect: boolean) => void;
}

export function GroupSelector({
    groups,
    selectedGroupIds,
    onChange,
    onGroupCreated,
}: GroupSelectorProps) {
    const [isCreating, setIsCreating] = React.useState(false);
    const [newGroupName, setNewGroupName] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const options = groups.map((g) => ({
        label: g.ihName,
        value: g.ihId,
    }));

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            toast.error("Group name is required");
            return;
        }

        setIsSubmitting(true);
        const result = await createGroupIH({ ihName: newGroupName.trim() });
        setIsSubmitting(false);

        if (result.success && result.data) {
            toast.success("Group created successfully");
            setNewGroupName("");
            setIsCreating(false);
            
            // Notify parent to add new group to the list and auto-select it
            onGroupCreated?.(result.data, true);
        } else {
            toast.error(result.error || "Failed to create group");
        }
    };

    return (
        <div className="space-y-3">
            <Label>Group Memberships</Label>
            
            <MultiSelect
                options={options}
                defaultValue={selectedGroupIds}
                onValueChange={onChange}
                placeholder="Select groups..."
                maxCount={3}
                resetOnDefaultValueChange={true}
            />

            {!isCreating ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                </Button>
            ) : (
                <div className="flex gap-2 items-end p-3 border rounded-md bg-muted/30">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">New Group Name</Label>
                        <Input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="e.g., Photography Club"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleCreateGroup();
                                }
                            }}
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateGroup}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Creating..." : "Create"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsCreating(false);
                            setNewGroupName("");
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
