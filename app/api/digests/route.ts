import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
        const skip = (page - 1) * limit;

        const [digests, total] = await Promise.all([
            prisma.digest.findMany({
                where: { status: "PUBLISHED" },
                orderBy: { publishDate: "desc" },
                skip,
                take: limit,
                include: {
                    sections: {
                        orderBy: { order: "asc" },
                    },
                },
            }),
            prisma.digest.count({ where: { status: "PUBLISHED" } }),
        ]);

        return NextResponse.json({
            digests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to list digests:", error);
        return NextResponse.json({ error: "Failed to list digests" }, { status: 500 });
    }
}
