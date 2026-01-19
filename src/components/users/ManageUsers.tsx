"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2 } from "lucide-react";

import { DashboardNav } from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UsersTable } from "./UsersTable";
import { GroupsView } from "./GroupsView";
import { UserFormModal } from "./UserFormModal";
import { UserWithDetails, GroupIHWithMembers } from "@/lib/types/user";

type ViewMode = "individual" | "groups";

interface ManageUsersProps {
    users: UserWithDetails[];
    groupIHs: GroupIHWithMembers[];
}

export default function ManageUsers({ users, groupIHs }: ManageUsersProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("individual");
    const router = useRouter();

    const refreshData = useCallback(() => {
        router.refresh();
    }, [router]);

    return (
        <div className="min-h-screen w-full bg-[#0C2C47] p-8">
            <DashboardNav />

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-4xl font-bold text-white">Manage Users</h1>
                    <p className="text-white/80">
                        {viewMode === "individual"
                            ? `${users.length} user${users.length !== 1 ? "s" : ""}`
                            : `${groupIHs.length} group${groupIHs.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <UserFormModal groups={groupIHs} mode="add" onSuccess={refreshData} />
            </div>

            {/* View Toggle */}
            <div className="mb-6 flex gap-2">
                <Button
                    variant={viewMode === "individual" ? "default" : "outline"}
                    onClick={() => setViewMode("individual")}
                    className={cn(
                        viewMode === "individual"
                            ? "bg-white text-[#0C2C47] hover:bg-white/90 hover:text-[#0C2C47]"
                            : "bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Users className="h-4 w-4 mr-2" />
                    Individual
                </Button>
                <Button
                    variant={viewMode === "groups" ? "default" : "outline"}
                    onClick={() => setViewMode("groups")}
                    className={cn(
                        viewMode === "groups"
                            ? "bg-white text-[#0C2C47] hover:bg-white/90 hover:text-[#0C2C47]"
                            : "bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <Building2 className="h-4 w-4 mr-2" />
                    Groups
                </Button>
            </div>

            {/* Content */}
            {viewMode === "individual" ? (
                <UsersTable users={users} groups={groupIHs} onRefresh={refreshData} />
            ) : (
                <GroupsView groups={groupIHs} users={users} onRefresh={refreshData} />
            )}
        </div>
    );
}
