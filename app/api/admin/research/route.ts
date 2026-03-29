import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const researches = await prisma.research.findMany({
            orderBy: { createdAt: "desc" },
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

        return NextResponse.json({ researches });
    } catch (error) {
        console.error("Failed to list research configs:", error);
        return NextResponse.json({ error: "Failed to list research configs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { knowledgeBaseId, name, description, searchWindowDays, minFindings, reRunOnFailure, teamId } = body;

        if (!knowledgeBaseId || !name) {
            return NextResponse.json(
                { error: "knowledgeBaseId and name are required" },
                { status: 400 }
            );
        }

        // Verify knowledge base exists
        const kb = await prisma.knowledgeBase.findUnique({
            where: { id: knowledgeBaseId },
        });
        if (!kb) {
            return NextResponse.json({ error: "KnowledgeBase not found" }, { status: 404 });
        }

        const research = await prisma.research.create({
            data: {
                knowledgeBaseId,
                name,
                description: description || null,
                searchWindowDays: searchWindowDays ?? 10,
                minFindings: minFindings ?? 15,
                reRunOnFailure: reRunOnFailure ?? true,
                teamId: teamId || null,
            },
            include: {
                knowledgeBase: true,
                sectionTemplates: {
                    orderBy: { order: "asc" },
                },
                prompts: true,
            },
        });

        return NextResponse.json(research, { status: 201 });
    } catch (error) {
        console.error("Failed to create research config:", error);
        return NextResponse.json({ error: "Failed to create research config" }, { status: 500 });
    }
}
