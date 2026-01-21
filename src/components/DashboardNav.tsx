"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardNav() {
    const pathname = usePathname();

    const tabs = [
        { name: "CATALOGUE", href: "/catalogue" },
        { name: "LOANS", href: "/loans" },
        { name: "USERS", href: "/users" },
    ];

    return (
        <div className="flex space-x-8 border-b border-white/10 mb-8">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                            "pb-4 text-sm font-bold tracking-wide transition-colors hover:text-white",
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
