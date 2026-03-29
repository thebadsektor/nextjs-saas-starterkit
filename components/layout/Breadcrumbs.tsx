"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

const PATH_LABELS: Record<string, string> = {
    admin: "Admin",
    digests: "Digests",
    research: "Research",
    schedule: "Schedule",
    users: "Users",
    forum: "Forum",
    feedback: "Feedback",
    "content-radar": "Content Radar",
    create: "Create",
    notifications: "Notifications",
    docs: "Documentation",
    subscription: "Subscription",
    account: "Account",
};

function isCuid(segment: string): boolean {
    return /^c[a-z0-9]{20,}$/i.test(segment) || segment.length > 20;
}

function getLabel(segment: string): string {
    if (PATH_LABELS[segment]) return PATH_LABELS[segment];
    if (isCuid(segment)) return "";
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    if (paths.length === 0) return null;

    // Filter out CUID segments
    const visiblePaths = paths.filter((p) => getLabel(p) !== "");

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                        <Link href="/">Home</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {visiblePaths.map((path, index) => {
                    // Build href from original paths up to this visible path's position
                    const originalIndex = paths.indexOf(path);
                    const href = `/${paths.slice(0, originalIndex + 1).join("/")}`;
                    const isLast = index === visiblePaths.length - 1;
                    const label = getLabel(path);

                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
