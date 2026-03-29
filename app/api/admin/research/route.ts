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

        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        // Auto-create KnowledgeBase if not provided
        let kbId = knowledgeBaseId;
        if (!kbId) {
            const kb = await prisma.knowledgeBase.create({
                data: {
                    name: `${name} — Knowledge Base`,
                    brandVoice: "a friendly, experienced funnel and marketing expert. Warm, conversational, like a friend sharing advice.",
                    sourceUrls: ["https://www.clickfunnels.com/blog/category/announcements/"],
                    previousTopics: [],
                    teamId: teamId || null,
                },
            });
            kbId = kb.id;
        } else {
            const kb = await prisma.knowledgeBase.findUnique({ where: { id: kbId } });
            if (!kb) {
                return NextResponse.json({ error: "KnowledgeBase not found" }, { status: 404 });
            }
        }

        // Create research config
        const research = await prisma.research.create({
            data: {
                knowledgeBaseId: kbId,
                name,
                description: description || null,
                searchWindowDays: searchWindowDays ?? 10,
                minFindings: minFindings ?? 15,
                reRunOnFailure: reRunOnFailure ?? true,
                teamId: teamId || null,
            },
        });

        // Auto-create 5 default SectionTemplates
        const defaultTemplates = [
            { key: "expert_tip", name: "FBM Expert Tip", order: 1, findingCategory: "MARKETING_STRATEGY", promptTemplate: `You are writing the "FBM Expert Tip" section for a marketing newsletter.\nWrite a marketing or growth strategy tip in 2-3 short paragraphs.\nVoice: {{BRAND_VOICE}}\nUse contractions. Second person. Short paragraphs (2-3 sentences max).\nEnd with a practical action the reader can take this week.\nDo NOT include section headers — just body content.` },
            { key: "marketing_tip", name: "Marketing Tip of the Week", order: 2, findingCategory: "AI_TOOL", promptTemplate: `You are writing the "Marketing Tip of the Week" section.\nWrite about a practical AI tool or productivity hack in under 150 words.\nVoice: {{BRAND_VOICE}}\nInclude a specific benefit or result. End with one clear action step starting with "Action step:".\nDo NOT include section headers — just body content.` },
            { key: "community_spotlight", name: "Community Spotlight", order: 3, findingCategory: "REAL_RESULTS", promptTemplate: `You are writing the "Community Spotlight" section.\nFrame as a success story from a funnel builder community member.\nLead with the result (numbers, revenue, growth), then explain how they achieved it.\nVoice: {{BRAND_VOICE}} Sharing something too good not to pass along.\nMake it authentic and relatable. Use a realistic first name.\nDo NOT include section headers — just body content.` },
            { key: "funnel_of_the_week", name: "Funnel of the Week", order: 4, findingCategory: "FUNNEL_TREND", promptTemplate: `You are writing the "Funnel of the Week" section.\nDescribe a funnel strategy in plain English — no jargon.\nInclude 2-3 observations the reader can steal for their own funnel.\nVoice: {{BRAND_VOICE}} Breaking down what works and why.\nEnd with: "Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com"\nDo NOT include section headers — just body content.` },
            { key: "food_for_thought", name: "Food for Thought", order: 5, findingCategory: "QUOTE", promptTemplate: `You are writing the "Food for Thought" section.\nProvide an inspiring business or marketing quote, properly attributed.\nFormat: Quote in quotation marks, then "— [Author Name]" on next line.\nThen add 1-2 sentences connecting the quote to funnel building or marketing.\nVoice: {{BRAND_VOICE}} Reflective and encouraging.\nDo NOT include section headers — just body content.` },
        ];

        await prisma.sectionTemplate.createMany({
            data: defaultTemplates.map((t) => ({
                researchId: research.id,
                ...t,
            })),
        });

        // Auto-create default Research (1A) and Writing (1B) prompts
        await prisma.researchPrompt.createMany({
            data: [
                {
                    researchId: research.id,
                    type: "RESEARCH",
                    name: "Standard Research (1A)",
                    content: "Search for 15 fresh, relevant findings for the newsletter. Use live search only. Check priority sources first. Return findings in structured format with title, summary, source URL, and date.",
                    isActive: true,
                    version: 1,
                },
                {
                    researchId: research.id,
                    type: "WRITING",
                    name: "Standard Writing (1B)",
                    content: "Write newsletter sections from research findings. Use the brand voice. Each section should be actionable and engaging. Output clean plain text, no markdown.",
                    isActive: true,
                    version: 1,
                },
            ],
        });

        // Re-fetch with all relations
        const result = await prisma.research.findUnique({
            where: { id: research.id },
            include: {
                knowledgeBase: true,
                sectionTemplates: { orderBy: { order: "asc" } },
                prompts: true,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create research config:", error);
        return NextResponse.json({ error: "Failed to create research config" }, { status: 500 });
    }
}
