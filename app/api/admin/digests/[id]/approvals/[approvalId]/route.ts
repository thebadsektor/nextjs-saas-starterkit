import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, approvalId } = await params;
        const body = await req.json();
        const { approved } = body;

        if (typeof approved !== "boolean") {
            return NextResponse.json(
                { error: "approved (boolean) is required" },
                { status: 400 }
            );
        }

        // Verify the approval exists and belongs to this digest
        const existing = await prisma.digestApproval.findUnique({
            where: { id: approvalId },
        });
        if (!existing || existing.digestId !== id) {
            return NextResponse.json({ error: "Approval not found" }, { status: 404 });
        }

        const approval = await prisma.digestApproval.update({
            where: { id: approvalId },
            data: {
                approved,
                approvedAt: approved ? new Date() : null,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
        });

        return NextResponse.json(approval);
    } catch (error) {
        console.error("Failed to update approval:", error);
        return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, approvalId } = await params;

        // Verify the approval exists and belongs to this digest
        const existing = await prisma.digestApproval.findUnique({
            where: { id: approvalId },
        });
        if (!existing || existing.digestId !== id) {
            return NextResponse.json({ error: "Approval not found" }, { status: 404 });
        }

        await prisma.digestApproval.delete({ where: { id: approvalId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to remove reviewer:", error);
        return NextResponse.json({ error: "Failed to remove reviewer" }, { status: 500 });
    }
}
