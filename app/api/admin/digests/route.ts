import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DigestStatus, PublishDay } from "@/app/generated/prisma/client";

const ARTICLE_SET_INCLUDE = {
    articles: {
        orderBy: { order: "asc" as const },
        include: {
            sectionTemplate: true,
            finding: true,
        },
    },
};

const APPROVALS_INCLUDE = {
    include: {
        user: {
            select: { id: true, name: true, email: true, image: true },
        },
    },
};

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
                    articleSet: {
                        include: ARTICLE_SET_INCLUDE,
                    },
                    approvals: APPROVALS_INCLUDE,
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
        const { digestNumber, publishDay, publishDate, title, researchId } = body;

        if (!digestNumber || !publishDay || !publishDate) {
            return NextResponse.json(
                { error: "digestNumber, publishDay, and publishDate are required" },
                { status: 400 }
            );
        }

        // Create digest
        const digest = await prisma.digest.create({
            data: {
                digestNumber,
                publishDay,
                publishDate: new Date(publishDate),
                title: title || null,
            },
        });

        // Create an empty ArticleSet for this digest
        const articleSet = await prisma.articleSet.create({
            data: {
                digestId: digest.id,
                status: "EMPTY",
            },
        });

        // If a researchId is provided, fetch active SectionTemplates and create empty Articles
        if (researchId) {
            const templates = await prisma.sectionTemplate.findMany({
                where: { researchId, isActive: true },
                orderBy: { order: "asc" },
                take: 5,
            });

            if (templates.length > 0) {
                await prisma.article.createMany({
                    data: templates.map((t, i) => ({
                        articleSetId: articleSet.id,
                        sectionTemplateId: t.id,
                        order: i + 1,
                        status: "EMPTY" as const,
                    })),
                });
            }
        }

        // Create a DigestApproval for the author
        await prisma.digestApproval.create({
            data: {
                digestId: digest.id,
                userId: session.user.id,
                role: "author",
            },
        });

        // Re-fetch to include all relations
        const digestWithRelations = await prisma.digest.findUnique({
            where: { id: digest.id },
            include: {
                articleSet: {
                    include: ARTICLE_SET_INCLUDE,
                },
                approvals: APPROVALS_INCLUDE,
            },
        });

        return NextResponse.json(digestWithRelations, { status: 201 });
    } catch (error) {
        console.error("Failed to create digest:", error);
        return NextResponse.json({ error: "Failed to create digest" }, { status: 500 });
    }
}
