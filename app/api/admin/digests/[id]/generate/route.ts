import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import openai from "@/lib/openai";

const DEFAULT_BRAND_VOICE = "a friendly, experienced funnel and marketing expert. Warm, conversational, like a friend sharing advice.";

const GENERIC_PROMPT = `You are writing a section for a marketing newsletter.
Write engaging, actionable content in 2-3 short paragraphs.
Use contractions (it's, you're, don't). Second person (you/your). Short paragraphs (2-3 sentences max).
Do NOT include any section headers — just the body content.`;

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
        const { articleId, topic, context, generateAll } = body;

        // Verify digest exists
        const digest = await prisma.digest.findUnique({
            where: { id },
            include: {
                articleSet: {
                    include: {
                        articles: {
                            orderBy: { order: "asc" },
                            include: {
                                sectionTemplate: {
                                    include: {
                                        research: {
                                            include: {
                                                knowledgeBase: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!digest) {
            return NextResponse.json({ error: "Digest not found" }, { status: 404 });
        }

        if (!digest.articleSet) {
            return NextResponse.json({ error: "Digest has no article set" }, { status: 400 });
        }

        // Batch mode: generate all articles in the set
        if (generateAll) {
            const results = [];
            for (const article of digest.articleSet.articles) {
                const result = await generateForArticle(article, topic, context);
                results.push(result);
            }

            // After generating all articles, update statuses
            await prisma.articleSet.update({
                where: { id: digest.articleSet.id },
                data: { status: "GENERATED" },
            });
            await prisma.digest.update({
                where: { id },
                data: { status: "IN_REVIEW" },
            });

            return NextResponse.json({ articles: results });
        }

        // Single article mode
        if (!articleId) {
            return NextResponse.json(
                { error: "articleId is required (or set generateAll: true)" },
                { status: 400 }
            );
        }

        const article = digest.articleSet.articles.find((a) => a.id === articleId);
        if (!article) {
            return NextResponse.json({ error: "Article not found in this digest" }, { status: 404 });
        }

        const result = await generateForArticle(article, topic, context);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to generate article content:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}

interface ArticleWithTemplate {
    id: string;
    sectionTemplate: {
        promptTemplate: string;
        name: string;
        research: {
            knowledgeBase: {
                brandVoice: string;
            };
        };
    } | null;
}

async function generateForArticle(
    article: ArticleWithTemplate,
    topic?: string,
    context?: string
) {
    const template = article.sectionTemplate;
    const brandVoice = template?.research?.knowledgeBase?.brandVoice || DEFAULT_BRAND_VOICE;

    // Use the SectionTemplate's promptTemplate, or fall back to generic
    let systemPrompt: string;
    if (template?.promptTemplate) {
        systemPrompt = template.promptTemplate.replace("{{BRAND_VOICE}}", brandVoice);
    } else {
        systemPrompt = `${GENERIC_PROMPT}\nVoice: ${brandVoice}`;
    }

    let userPrompt = `Generate content for this newsletter section.`;
    if (topic) {
        userPrompt += `\n\nTopic/subject to write about: ${topic}`;
    }
    if (context) {
        userPrompt += `\n\nAdditional context: ${context}`;
    }
    if (!topic && !context) {
        userPrompt += `\n\nChoose a timely, relevant topic for ClickFunnels users and funnel builders. Make it specific and actionable.`;
    }

    userPrompt += `\n\nRespond in this exact JSON format (no markdown, no code fences):
{"heading": "The section heading", "body": "The section body content"}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
        throw new Error("No response from AI");
    }

    // Parse JSON response — handle potential markdown fences
    let cleaned = raw;
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    // Update article in DB
    await prisma.article.update({
        where: { id: article.id },
        data: {
            heading: parsed.heading,
            body: parsed.body,
            status: "GENERATED",
            generatedAt: new Date(),
        },
    });

    return {
        articleId: article.id,
        heading: parsed.heading,
        body: parsed.body,
    };
}
