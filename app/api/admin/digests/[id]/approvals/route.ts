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
        const { userId, email, role } = body;

        if (!role) {
            return NextResponse.json(
                { error: "role is required" },
                { status: 400 }
            );
        }

        if (!userId && !email) {
            return NextResponse.json(
                { error: "userId or email is required" },
                { status: 400 }
            );
        }

        // Verify the digest exists
        const digest = await prisma.digest.findUnique({ where: { id } });
        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        // Look up user by email or userId
        let resolvedUserId = userId;
        if (!resolvedUserId && email) {
            const user = await prisma.user.findFirst({ where: { email } });
            if (!user) {
                return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
            }
            resolvedUserId = user.id;
        } else {
            const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        }

        // Check if approval already exists
        const existing = await prisma.digestApproval.findUnique({
            where: { digestId_userId: { digestId: id, userId: resolvedUserId } },
        });
        if (existing) {
            return NextResponse.json({ error: "This user is already a reviewer on this digest" }, { status: 409 });
        }

        const approval = await prisma.digestApproval.create({
            data: {
                digestId: id,
                userId: resolvedUserId,
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
