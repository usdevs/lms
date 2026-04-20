"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { getAvailableTabs } from "@/lib/auth/rbac";

interface DashboardNavProps {
    userRole?: UserRole;
}

export function DashboardNav({ userRole }: DashboardNavProps) {
    const pathname = usePathname();
    // Unauthenticated users only see Catalogue tab
    const tabs = userRole
        ? getAvailableTabs(userRole)
        : [{ name: 'CATALOGUE', href: '/catalogue' }];

    return (
        <div className="flex gap-4 md:gap-8 border-b border-white/10 mb-6 md:mb-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                            "pb-3 md:pb-4 text-xs md:text-sm font-bold tracking-wide transition-colors hover:text-white whitespace-nowrap shrink-0",
                            isActive
                                ? "border-b-2 border-[#57A6FF] text-white"
                                : "text-white/50 border-b-2 border-transparent"
                        )}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
