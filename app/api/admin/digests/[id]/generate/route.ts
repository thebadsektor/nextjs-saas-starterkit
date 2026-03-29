import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import openai from "@/lib/openai";

const SECTION_PROMPTS: Record<string, string> = {
    EXPERT_TIP: `You are writing the "FBM Expert Tip" section for the FBM Digest newsletter.
Write a marketing or growth strategy tip in 2-3 short paragraphs.
Voice: Lee Chapman — friendly, experienced funnel and marketing expert. Warm, conversational, like a friend sharing advice.
Use contractions (it's, you're, don't). Second person (you/your). Short paragraphs (2-3 sentences max).
End with a practical action the reader can take this week.
Do NOT include any section headers — just the body content.`,

    MARKETING_TIP: `You are writing the "Marketing Tip of the Week" section for the FBM Digest newsletter.
Write about a practical AI tool or productivity hack in under 150 words.
Voice: Lee Chapman — friendly, conversational, action-oriented.
Include the specific benefit or result if possible.
End with one clear action step the reader can take this week, starting with "Action step:".
Do NOT include any section headers — just the body content.`,

    COMMUNITY_SPOTLIGHT: `You are writing the "Community Spotlight" section for the FBM Digest newsletter.
Frame this as a success story from a ClickFunnels/funnel builder community member.
Lead with the result (numbers, revenue, growth), then explain how they achieved it.
Voice: Lee Chapman sharing something too good not to pass along.
Make it feel authentic and relatable. Use a realistic first name.
Do NOT include any section headers — just the body content.`,

    FUNNEL_OF_THE_WEEK: `You are writing the "Funnel of the Week" section for the FBM Digest newsletter.
Describe a funnel strategy in plain English — no jargon.
Include 2-3 observations or elements the reader can steal for their own funnel.
Voice: Lee Chapman — breaking down what works and why.
End with exactly this line: "Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com"
Do NOT include any section headers — just the body content.`,

    FOOD_FOR_THOUGHT: `You are writing the "Food for Thought" section for the FBM Digest newsletter.
Provide an inspiring business or marketing quote, properly attributed.
Format: Start with the quote in quotation marks, then "— [Author Name]" on the next line.
Then add 1-2 sentences from Lee connecting the quote to funnel building or marketing.
Voice: Lee Chapman — reflective, encouraging.
Do NOT include any section headers — just the body content.`,
};

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
        const { sectionType, topic, context } = body;

        if (!sectionType || !SECTION_PROMPTS[sectionType]) {
            return NextResponse.json(
                { error: "Invalid sectionType. Must be one of: " + Object.keys(SECTION_PROMPTS).join(", ") },
                { status: 400 }
            );
        }

        const systemPrompt = SECTION_PROMPTS[sectionType];

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
            return NextResponse.json({ error: "No response from AI" }, { status: 500 });
        }

        // Parse JSON response — handle potential markdown fences
        let cleaned = raw;
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
            heading: parsed.heading,
            body: parsed.body,
        });
    } catch (error) {
        console.error("Failed to generate section content:", error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }
        return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }
}
