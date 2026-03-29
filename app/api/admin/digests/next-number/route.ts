import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await prisma.digest.aggregate({
            _max: {
                digestNumber: true,
            },
        });

        const nextNumber = (result._max.digestNumber ?? 0) + 1;

        return NextResponse.json({ nextNumber });
    } catch (error) {
        console.error("Failed to get next digest number:", error);
        return NextResponse.json({ error: "Failed to get next digest number" }, { status: 500 });
    }
}
