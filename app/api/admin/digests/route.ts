import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DigestStatus, PublishDay, SectionType } from "@/app/generated/prisma/client";

const SECTION_TYPES_ORDERED: SectionType[] = [
    "EXPERT_TIP",
    "MARKETING_TIP",
    "COMMUNITY_SPOTLIGHT",
    "FUNNEL_OF_THE_WEEK",
    "FOOD_FOR_THOUGHT",
];

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as DigestStatus | null;
        const day = searchParams.get("day") as PublishDay | null;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (day) where.publishDay = day;

        const [digests, total, totalAll, published, inReview, drafts] = await Promise.all([
            prisma.digest.findMany({
                where,
                orderBy: { publishDate: "desc" },
                skip,
                take: limit,
                include: {
                    sections: {
                        orderBy: { order: "asc" },
                    },
                    approvals: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, image: true },
                            },
                        },
                    },
                },
            }),
            prisma.digest.count({ where }),
            prisma.digest.count(),
            prisma.digest.count({ where: { status: "PUBLISHED" } }),
            prisma.digest.count({ where: { status: "IN_REVIEW" } }),
            prisma.digest.count({ where: { status: "DRAFT" } }),
        ]);

        return NextResponse.json({
            digests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                total: totalAll,
                published,
                inReview,
                drafts,
            },
        });
    } catch (error) {
        console.error("Failed to list admin digests:", error);
        return NextResponse.json({ error: "Failed to list digests" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { digestNumber, publishDay, publishDate, title } = body;

        if (!digestNumber || !publishDay || !publishDate) {
            return NextResponse.json(
                { error: "digestNumber, publishDay, and publishDate are required" },
                { status: 400 }
            );
        }

        const digest = await prisma.digest.create({
            data: {
                digestNumber,
                publishDay,
                publishDate: new Date(publishDate),
                title: title || null,
                sections: {
                    create: SECTION_TYPES_ORDERED.map((sectionType, index) => ({
                        sectionType,
                        order: index + 1,
                    })),
                },
            },
            include: {
                sections: {
                    orderBy: { order: "asc" },
                },
                approvals: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
            },
        });

        // Create a DigestApproval for the author
        await prisma.digestApproval.create({
            data: {
                digestId: digest.id,
                userId: session.user.id,
                role: "author",
            },
        });

        // Re-fetch to include the newly created approval
        const digestWithApprovals = await prisma.digest.findUnique({
            where: { id: digest.id },
            include: {
                sections: {
                    orderBy: { order: "asc" },
                },
                approvals: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(digestWithApprovals, { status: 201 });
    } catch (error) {
        console.error("Failed to create digest:", error);
        return NextResponse.json({ error: "Failed to create digest" }, { status: 500 });
    }
}
