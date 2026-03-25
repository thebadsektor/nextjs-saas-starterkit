import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const digest = await prisma.digest.findFirst({
            where: { status: "PUBLISHED" },
            orderBy: { publishDate: "desc" },
            include: {
                sections: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!digest) {
            return NextResponse.json({ error: "No published digests found" }, { status: 404 });
        }

        return NextResponse.json(digest);
    } catch (error) {
        console.error("Failed to get latest digest:", error);
        return NextResponse.json({ error: "Failed to get latest digest" }, { status: 500 });
    }
}
