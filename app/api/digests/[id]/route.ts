import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if requester is admin (optional auth)
        let isAdmin = false;
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            if (session?.user.role === "admin") {
                isAdmin = true;
            }
        } catch {
            // Not authenticated, that's fine
        }

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

        // Only return non-published digests to admins
        if (digest.status !== "PUBLISHED" && !isAdmin) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        return NextResponse.json(digest);
    } catch (error) {
        console.error("Failed to get digest:", error);
        return NextResponse.json({ error: "Failed to get digest" }, { status: 500 });
    }
}
