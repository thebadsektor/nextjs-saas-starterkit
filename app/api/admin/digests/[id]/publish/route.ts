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

        const digest = await prisma.digest.findUnique({
            where: { id },
            include: {
                approvals: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
            },
        });
        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        const approvals = digest.approvals;
        const allApproved = approvals.length > 0 && approvals.every((a: { approved: boolean }) => a.approved);
        if (!allApproved) {
            return NextResponse.json(
                {
                    error: "All assigned reviewers must approve before publishing",
                    approvals: approvals.map((a: { role: string; approved: boolean }) => ({
                        role: a.role,
                        approved: a.approved,
                    })),
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
                articleSet: {
                    include: {
                        articles: {
                            orderBy: { order: "asc" },
                            include: {
                                sectionTemplate: true,
                            },
                        },
                    },
                },
                approvals: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                    },
                },
            },
        });

        // Append finding titles to KnowledgeBase.previousTopics
        const publishedDigest = await prisma.digest.findUnique({
            where: { id },
            include: {
                articleSet: {
                    include: {
                        articles: {
                            include: { finding: true },
                        },
                        run: {
                            include: { research: { include: { knowledgeBase: true } } },
                        },
                    },
                },
            },
        });

        if (publishedDigest?.articleSet?.run?.research?.knowledgeBase) {
            const kb = publishedDigest.articleSet.run.research.knowledgeBase;
            const findingTitles = publishedDigest.articleSet.articles
                .filter(a => a.finding)
                .map(a => a.finding!.title);

            if (findingTitles.length > 0) {
                await prisma.knowledgeBase.update({
                    where: { id: kb.id },
                    data: {
                        previousTopics: [...kb.previousTopics, ...findingTitles],
                    },
                });
            }
        }

        return NextResponse.json(published);
    } catch (error) {
        console.error("Failed to publish digest:", error);
        return NextResponse.json({ error: "Failed to publish digest" }, { status: 500 });
    }
}
