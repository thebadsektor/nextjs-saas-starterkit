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

        const research = await prisma.research.findUnique({
            where: { id },
            include: {
                knowledgeBase: true,
                sectionTemplates: {
                    orderBy: { order: "asc" },
                },
                prompts: {
                    orderBy: { createdAt: "desc" },
                },
                runs: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        findings: {
                            orderBy: { order: "asc" },
                        },
                        _count: {
                            select: { findings: true, articleSets: true },
                        },
                    },
                },
            },
        });

        if (!research) {
            return NextResponse.json({ error: "Research not found" }, { status: 404 });
        }

        return NextResponse.json(research);
    } catch (error) {
        console.error("Failed to get research:", error);
        return NextResponse.json({ error: "Failed to get research" }, { status: 500 });
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

        const existing = await prisma.research.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Research not found" }, { status: 404 });
        }

        const allowedFields = ["name", "description", "searchWindowDays", "minFindings", "reRunOnFailure", "knowledgeBaseId"];
        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const research = await prisma.research.update({
            where: { id },
            data: updateData,
            include: {
                knowledgeBase: true,
                sectionTemplates: {
                    orderBy: { order: "asc" },
                },
                prompts: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        return NextResponse.json(research);
    } catch (error) {
        console.error("Failed to update research:", error);
        return NextResponse.json({ error: "Failed to update research" }, { status: 500 });
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

        const existing = await prisma.research.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Research not found" }, { status: 404 });
        }

        await prisma.research.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete research:", error);
        return NextResponse.json({ error: "Failed to delete research" }, { status: 500 });
    }
}
