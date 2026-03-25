import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
                sections: {
                    orderBy: { order: "asc" },
                },
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

        const { sections, ...digestFields } = body;

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
        const digest = await prisma.digest.update({
            where: { id },
            data: updateData,
            include: {
                sections: {
                    orderBy: { order: "asc" },
                },
            },
        });

        // Update sections if provided
        if (sections && Array.isArray(sections)) {
            for (const section of sections) {
                if (!section.id) continue;
                const sectionUpdate: Record<string, unknown> = {};
                const sectionFields = ["heading", "body", "sourceUrl", "sourceTitle"];
                for (const field of sectionFields) {
                    if (section[field] !== undefined) {
                        sectionUpdate[field] = section[field];
                    }
                }
                if (Object.keys(sectionUpdate).length > 0) {
                    await prisma.digestSection.update({
                        where: { id: section.id },
                        data: sectionUpdate,
                    });
                }
            }

            // Re-fetch with updated sections
            const updated = await prisma.digest.findUnique({
                where: { id },
                include: {
                    sections: {
                        orderBy: { order: "asc" },
                    },
                },
            });

            return NextResponse.json(updated);
        }

        return NextResponse.json(digest);
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
