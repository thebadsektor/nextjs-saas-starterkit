import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const APPROVALS_INCLUDE = {
    include: {
        user: {
            select: { id: true, name: true, email: true, image: true },
        },
    },
};

const ARTICLE_SET_INCLUDE = {
    include: {
        articles: {
            orderBy: { order: "asc" as const },
            include: {
                sectionTemplate: true,
                finding: true,
            },
        },
    },
};

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const digest = await prisma.digest.findUnique({
            where: { id },
            include: {
                articleSet: ARTICLE_SET_INCLUDE,
                approvals: APPROVALS_INCLUDE,
            },
        });

        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        return NextResponse.json(digest);
    } catch (error) {
        console.error("Failed to get digest:", error);
        return NextResponse.json({ error: "Failed to get digest" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check digest exists
        const existing = await prisma.digest.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        const { articles, ...digestFields } = body;

        // Build digest update data from allowed fields
        const allowedFields = ["title", "subjectLine", "preHeader", "personalNote", "status", "publishDate"];
        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (digestFields[field] !== undefined) {
                updateData[field] = field === "publishDate"
                    ? new Date(digestFields[field])
                    : digestFields[field];
            }
        }

        // Update digest fields
        await prisma.digest.update({
            where: { id },
            data: updateData,
        });

        // Update articles if provided
        if (articles && Array.isArray(articles)) {
            for (const article of articles) {
                if (!article.id) continue;
                const articleUpdate: Record<string, unknown> = {};
                const articleFields = ["heading", "body", "sourceUrl", "sourceTitle", "status"];
                for (const field of articleFields) {
                    if (article[field] !== undefined) {
                        articleUpdate[field] = article[field];
                    }
                }
                if (Object.keys(articleUpdate).length > 0) {
                    await prisma.article.update({
                        where: { id: article.id },
                        data: articleUpdate,
                    });
                }
            }
        }

        // Re-fetch with all relations
        const updated = await prisma.digest.findUnique({
            where: { id },
            include: {
                articleSet: ARTICLE_SET_INCLUDE,
                approvals: APPROVALS_INCLUDE,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update digest:", error);
        return NextResponse.json({ error: "Failed to update digest" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.digest.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        await prisma.digest.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete digest:", error);
        return NextResponse.json({ error: "Failed to delete digest" }, { status: 500 });
    }
}
