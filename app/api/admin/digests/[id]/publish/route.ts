import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const digest = await prisma.digest.findUnique({ where: { id } });
        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        if (!digest.leeApproved || !digest.hannaApproved) {
            return NextResponse.json(
                {
                    error: "Cannot publish: both Lee and Hanna must approve before publishing",
                    leeApproved: digest.leeApproved,
                    hannaApproved: digest.hannaApproved,
                },
                { status: 400 }
            );
        }

        const published = await prisma.digest.update({
            where: { id },
            data: {
                status: "PUBLISHED",
                publishedAt: new Date(),
            },
            include: {
                sections: {
                    orderBy: { order: "asc" },
                },
            },
        });

        return NextResponse.json(published);
    } catch (error) {
        console.error("Failed to publish digest:", error);
        return NextResponse.json({ error: "Failed to publish digest" }, { status: 500 });
    }
}
