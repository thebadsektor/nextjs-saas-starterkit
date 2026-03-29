import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
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
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: "userId and role are required" },
                { status: 400 }
            );
        }

        // Verify the digest exists
        const digest = await prisma.digest.findUnique({ where: { id } });
        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        // Verify the user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const approval = await prisma.digestApproval.create({
            data: {
                digestId: id,
                userId,
                role,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
            },
        });

        return NextResponse.json(approval, { status: 201 });
    } catch (error) {
        console.error("Failed to add reviewer:", error);
        return NextResponse.json({ error: "Failed to add reviewer" }, { status: 500 });
    }
}
