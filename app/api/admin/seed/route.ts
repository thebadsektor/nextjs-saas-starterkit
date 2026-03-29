import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PublishDay, DigestStatus, SectionType } from "@/app/generated/prisma/client";

const DISCUSSION_TITLES = [
    "Best Funnel Strategies for Lead Generation",
    "How I 3x'd My Conversion Rate with ClickFunnels",
    "Top AI Tools for Marketing Automation",
    "Email Sequence That Generated $50K in 30 Days",
    "Funnel Teardown: High-Converting Webinar Funnel",
    "Building a Community Around Your Funnel",
    "Best Practices for Upsell and Downsell Funnels",
    "How to Use Storytelling in Your Funnel Copy",
    "Paid Ads vs Organic Traffic for Funnels",
    "ClickFunnels 2.0 Tips and Tricks",
    "Split Testing Your Landing Pages Effectively",
    "Creating a Membership Funnel That Retains",
    "The Power of Tripwire Offers",
    "How to Write Headlines That Convert",
    "Scaling Your Funnel with Affiliate Marketing",
    "Video Sales Letters: Still Worth It?",
    "Building Trust Before the Sale",
    "Cart Abandonment Recovery Strategies",
    "Using Social Proof in Your Funnels",
    "The Rise of AI-Powered Funnel Builders"
];

const CONTENT_SNIPPETS = [
    "I've been wondering about the best way to handle this in a production environment. Any tips?",
    "Here is a comprehensive guide on how I solved this issue in my latest project.",
    "Does anyone have experience with this specific stack? I'm hitting some roadblocks.",
    "The performance gains are quite significant. Highly recommend checking it out.",
    "What are your thoughts on the latest update? I feel like it's a game changer.",
    "I'm seeing some inconsistent behavior across browsers. Is this a known issue?",
    "This boilerplate made my life so much easier. Here's how I configured it.",
    "Security should always be the priority. Make sure to follow these steps.",
    "Is it worth switching from the old pattern to the new one? Let's discuss.",
    "I found this great resource that explains it perfectly. Linking it below."
];

const FEEDBACK_TEXTS = [
    "The landing page looks amazing! Great job.",
    "I found a small bug in the user settings page.",
    "Can you add support for more social providers?",
    "The documentation is slightly outdated in the auth section.",
    "Love the new theme toggle! Light mode is a bit too bright though.",
    "Is there a way to export my data as CSV?",
    "The admin panel is very intuitive. Keep it up.",
    "I'm having trouble resetting my password.",
    "The forum loading speed could be improved.",
    "Thanks for the quick response to my previous ticket!",
    "Feature request: Real-time notifications.",
    "The mobile responsiveness of the forum is perfect.",
    "I'd like to see more analytics on the dashboard.",
    "How do I change my profile picture?",
    "The search filters in the forum are very helpful.",
    "Is there an API I can use for my own custom frontend?",
    "The password requirements are a bit too strict.",
    "I love the glassmorphism effects on the cards.",
    "Can we have a private category in the forum?",
    "The 'System' role logic is a bit confusing to me."
];

export async function POST() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // Seed Discussions
        const discussionsToCreate = DISCUSSION_TITLES.map((title, i) => ({
            title,
            content: CONTENT_SNIPPETS[i % CONTENT_SNIPPETS.length],
            userId,
            isPublic: true,
            isSeo: i % 2 === 0,
            views: Math.floor(Math.random() * 500),
        }));

        await prisma.discussion.createMany({
            data: discussionsToCreate,
        });

        // Seed Feedback
        const feedbackToCreate = FEEDBACK_TEXTS.map((text, i) => ({
            text,
            email: i % 3 === 0 ? "test@example.com" : userEmail,
            userId: i % 3 === 0 ? null : userId,
            status: i % 5 === 0 ? "replied" : "pending",
        }));

        await prisma.feedback.createMany({
            data: feedbackToCreate,
        });

        // Seed Digests (6 sample digests — 2 weeks)
        const digestSeeds = [
            {
                digestNumber: 94,
                publishDay: PublishDay.MONDAY,
                publishDate: new Date("2026-03-16"),
                status: DigestStatus.PUBLISHED,
                publishedAt: new Date("2026-03-16T09:00:00Z"),
                title: "FBM Digest #94",
                subjectLine: "FBM Digest #94: AI funnels, split test wins, and more...",
                preHeader: "This week's best funnel insights",
                personalNote: "Hope you had a great weekend! I spent mine testing a new webinar funnel — results coming next week. — Lee",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "The 3-Step Funnel That Converts Cold Traffic", body: "Russell Brunson shared a surprisingly simple funnel structure on his podcast this week. The idea is to use a short quiz as the entry point, followed by a personalized results page, then a tailored offer. The key insight? Personalization at the results stage increased opt-ins by 47% compared to a standard lead magnet page.\n\nIf you're running paid traffic, this is worth testing. Start with 3-5 quiz questions that segment your audience by their biggest challenge, then serve different copy on the results page based on their answers.", sourceUrl: "https://example.com/russell-quiz-funnel", sourceTitle: "Russell Brunson Podcast Episode 423" },
                    { type: SectionType.MARKETING_TIP, heading: "Try Castmagic for Repurposing Your Content", body: "Castmagic is an AI tool that turns any audio or video into blog posts, social captions, email sequences, and more. Upload a webinar recording and it generates a week's worth of content in minutes.\n\nAction step: Record your next funnel walkthrough, upload it to Castmagic, and use the output for 5 social posts this week.", sourceUrl: "https://example.com/castmagic", sourceTitle: "Product Hunt — Castmagic" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "Community Win: $23K Launch with a Simple Tripwire", body: "FBM member Sarah K. shared her launch results in the community this week. She used a $7 tripwire ebook leading into a $297 course upsell. The numbers: 1,200 tripwire sales, 19% took the upsell, totaling $23,166 in the first 5 days.\n\nThe takeaway? Don't underestimate low-ticket entry offers. They build trust fast and the upsell conversion was nearly 4x what she expected.", sourceUrl: "https://example.com/community-win", sourceTitle: "FBM Community Forum" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "Webinar Funnel Teardown: How Alex Hormozi Fills Rooms", body: "This week we're looking at the registration funnel Hormozi's team uses for their live workshops. Three things stand out: the countdown timer creates urgency without feeling fake, the social proof section shows real business owners (not stock photos), and the post-registration page immediately offers a free resource.\n\nSteal-worthy moves: Add a \"what you'll learn\" bullet list (not features, outcomes), use a 2-step opt-in, and always have a valuable next step after registration.\n\nWant a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com", sourceUrl: "https://example.com/hormozi-funnel", sourceTitle: "Funnel Teardown Analysis" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "\"The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.\"", body: "— Simon Sinek\n\nThis one hit home for me this week. Sometimes we chase every lead when we should be attracting the right ones. Your funnel copy should repel as much as it attracts.", sourceUrl: "https://example.com/sinek-quote", sourceTitle: "Start With Why" },
                ],
            },
            {
                digestNumber: 95,
                publishDay: PublishDay.WEDNESDAY,
                publishDate: new Date("2026-03-18"),
                status: DigestStatus.PUBLISHED,
                publishedAt: new Date("2026-03-18T09:00:00Z"),
                title: "FBM Digest #95",
                subjectLine: "FBM Digest #95: Email sequences, community wins, and more...",
                preHeader: "Midweek marketing fuel",
                personalNote: "Tried a new Nashville BBQ spot this week — brisket was next level. Now back to funnels! — Lee",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "The 5-Email Welcome Sequence That Builds Trust Fast", body: "Neil Patel published a breakdown of the ideal welcome email sequence this week. The formula: Email 1 delivers the lead magnet, Email 2 shares your story, Email 3 provides unexpected value, Email 4 introduces a soft CTA, Email 5 makes the offer.\n\nThe key insight is Email 3 — giving something valuable they didn't ask for builds reciprocity and trust before you ever pitch.", sourceUrl: "https://example.com/neil-patel-emails", sourceTitle: "Neil Patel Blog" },
                    { type: SectionType.MARKETING_TIP, heading: "Use Opus Clip to Turn Long Videos into Shorts", body: "Opus Clip uses AI to find the most engaging moments in your long-form videos and turns them into short-form clips. Perfect for repurposing webinar replays into social content.\n\nAction step: Upload your last webinar recording and create 3 clips for Instagram Reels or TikTok this week.", sourceUrl: "https://example.com/opus-clip", sourceTitle: "Opus Clip" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "From Zero to 500 Subscribers in 14 Days", body: "Mike R. from the FBM community shared how he built his email list from scratch using a simple squeeze page and $200 in Facebook ads. His secret? A hyper-specific lead magnet targeting one pain point for real estate agents.\n\nCost per lead: $0.40. That's the power of niching down.", sourceUrl: "https://example.com/mike-case-study", sourceTitle: "FBM Community Forum" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "Challenge Funnel: 5-Day Format That Converts", body: "Challenge funnels are having a moment. The structure is simple: free 5-day challenge, daily email with a quick win, Day 5 pitch to a paid program. What makes it work is the micro-commitments — each day's task builds investment.\n\nThree things to steal: Keep daily tasks under 15 minutes, use a private Facebook group for accountability, and make Day 3 the biggest value bomb.\n\nWant a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com", sourceUrl: "https://example.com/challenge-funnel", sourceTitle: "Challenge Funnel Blueprint" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "\"Your most unhappy customers are your greatest source of learning.\"", body: "— Bill Gates\n\nWorth remembering when you get that negative email or refund request. There's gold in the feedback if you're willing to dig.", sourceUrl: "https://example.com/gates-quote", sourceTitle: "Business @ The Speed of Thought" },
                ],
            },
            {
                digestNumber: 96,
                publishDay: PublishDay.FRIDAY,
                publishDate: new Date("2026-03-20"),
                status: DigestStatus.PUBLISHED,
                publishedAt: new Date("2026-03-20T09:00:00Z"),
                title: "FBM Digest #96",
                subjectLine: "FBM Digest #96: Weekend reads, funnel hacks, and more...",
                preHeader: "Finish the week strong",
                personalNote: "Taking the kids hiking this weekend. Sometimes the best ideas come when you step away from the screen. — Lee",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "Why Long-Form Sales Pages Still Outperform Short Ones", body: "HubSpot released data this week showing that long-form sales pages (2,000+ words) convert 30% better than short pages for products over $100. The reason? Higher-priced purchases need more objection handling.\n\nThe formula: Lead with the transformation, stack proof in the middle, handle objections before the CTA. Don't be afraid of length — be afraid of boring copy.", sourceUrl: "https://example.com/hubspot-long-form", sourceTitle: "HubSpot Marketing Blog" },
                    { type: SectionType.MARKETING_TIP, heading: "Perplexity AI for Market Research", body: "Perplexity AI is becoming a secret weapon for funnel builders. Ask it to research your competitor's positioning, find trending topics in your niche, or summarize customer reviews.\n\nAction step: Ask Perplexity 'What are the top 5 complaints people have about [your niche] courses?' and use the answers in your sales copy.", sourceUrl: "https://example.com/perplexity", sourceTitle: "Perplexity AI" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "How One Member Doubled Her Course Price (and Sold More)", body: "FBM member Lisa T. raised her course price from $197 to $397 after adding a live Q&A component. Result: Sales actually increased by 15% while revenue doubled. Higher prices signal higher value.\n\nThe lesson: Before you discount, consider what you can add to justify a higher price.", sourceUrl: "https://example.com/lisa-pricing", sourceTitle: "FBM Community Forum" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "The 'Invisible Funnel': Free First, Pay Later", body: "The invisible funnel lets people consume your content before they pay. Structure: Free training → checkout page appears after they've watched 80% → they only pay if they found it valuable.\n\nWhy it works: Removes all risk for the buyer. Russell Brunson popularized this and reports 60%+ conversion rates because the value is proven before the ask.\n\nWant a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com", sourceUrl: "https://example.com/invisible-funnel", sourceTitle: "ClickFunnels Blog" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "\"Don't find customers for your products, find products for your customers.\"", body: "— Seth Godin\n\nThis is the funnel builder's mantra. Build the funnel around what your audience actually needs, not what you want to sell.", sourceUrl: "https://example.com/godin-quote", sourceTitle: "Seth Godin's Blog" },
                ],
            },
            {
                digestNumber: 97,
                publishDay: PublishDay.MONDAY,
                publishDate: new Date("2026-03-23"),
                status: DigestStatus.PUBLISHED,
                publishedAt: new Date("2026-03-23T09:00:00Z"),
                title: "FBM Digest #97",
                subjectLine: "FBM Digest #97: New ClickFunnels features, AI copy, and more...",
                preHeader: "Start the week with an edge",
                personalNote: "Monday energy! Let's make this the week you finally launch that funnel you've been planning. — Lee",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "The Soap Opera Email Sequence Explained", body: "If you've read DotCom Secrets, you know about the Soap Opera Sequence. This week, Alex Cattoni broke it down in a new video with modern examples.\n\nThe 5 emails: Set the stage, create high drama, share the epiphany, reveal hidden benefits, deliver urgency. Each email ends on a cliffhanger that makes them open the next one.", sourceUrl: "https://example.com/soap-opera-emails", sourceTitle: "Alex Cattoni YouTube" },
                    { type: SectionType.MARKETING_TIP, heading: "Claude for Writing Funnel Copy That Sounds Human", body: "Claude (by Anthropic) is becoming the go-to AI for funnel copy because it handles tone and voice better than alternatives. The trick is giving it a reference sample of your writing first.\n\nAction step: Paste 3 of your best emails into Claude and ask it to write your next email in the same voice.", sourceUrl: "https://example.com/claude-copy", sourceTitle: "The Rundown AI" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "First Funnel, First $10K Month", body: "New FBM member James D. hit $10K in his first month using a simple opt-in → tripwire → core offer funnel. He spent $500 on ads and focused on one audience: local gym owners.\n\nHis advice: 'Stop trying to sell to everyone. Pick one person and build the entire funnel for them.'", sourceUrl: "https://example.com/james-10k", sourceTitle: "FBM Community Forum" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "ClickFunnels 2.0 Blog Funnel: Content That Converts", body: "ClickFunnels just shipped a blog funnel template that turns content readers into leads. The structure: SEO blog post → in-content CTA → lead magnet popup → nurture sequence.\n\nKey features: Built-in A/B testing on CTAs, automatic lead tagging based on which post they read, and seamless handoff to your email sequence.\n\nWant a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com", sourceUrl: "https://www.clickfunnels.com/blog/category/announcements/", sourceTitle: "ClickFunnels Announcements" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "\"Revenue is vanity, profit is sanity, but cash flow is reality.\"", body: "— Unknown\n\nAs you scale your funnels, keep an eye on the numbers that actually matter. A $100K launch means nothing if your ad spend ate it all.", sourceUrl: "https://example.com/cashflow-quote", sourceTitle: "Business Wisdom" },
                ],
            },
            {
                digestNumber: 98,
                publishDay: PublishDay.WEDNESDAY,
                publishDate: new Date("2026-03-25"),
                status: DigestStatus.IN_REVIEW,
                title: "FBM Digest #98",
                subjectLine: "FBM Digest #98: Retargeting secrets, community spotlight, and more...",
                preHeader: "Midweek marketing boost",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "Retargeting Warm Audiences: The 3-Touch Framework", body: "Social Media Examiner published a guide on retargeting that's worth your time. The framework: Touch 1 is a testimonial video, Touch 2 is an objection-handling post, Touch 3 is a direct offer with urgency.\n\nThe data shows this 3-touch sequence converts 5x better than sending the same ad repeatedly.", sourceUrl: "https://example.com/retargeting", sourceTitle: "Social Media Examiner" },
                    { type: SectionType.MARKETING_TIP, heading: "Descript: Edit Video Like a Google Doc", body: "Descript lets you edit video by editing the transcript text. Delete a sentence from the text, and the video cuts automatically. Perfect for cleaning up webinar recordings.\n\nAction step: Record a 10-minute funnel walkthrough, clean it up in Descript, and use it as a lead magnet.", sourceUrl: "https://example.com/descript", sourceTitle: "Descript" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "Turning Refund Requests into Testimonials", body: "FBM member Priya S. shared a clever approach: when someone requests a refund, she offers a free 15-minute call to help them get results instead. 60% of people accept, and half of those become her biggest advocates.\n\n'Refund requests are just people saying they need more help,' she says.", sourceUrl: "https://example.com/priya-refunds", sourceTitle: "FBM Community Forum" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "The Thank You Page Upsell That Adds 30% Revenue", body: "Most funnel builders ignore the thank you page. Big mistake. Add a one-time offer immediately after opt-in and you can capture buyers at their most engaged moment.\n\nBest practices: Keep it under $47, make it complementary to the lead magnet, and use a countdown timer for urgency.\n\nWant a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com", sourceUrl: "https://example.com/thank-you-upsell", sourceTitle: "Funnel Strategy Guide" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "\"The best marketing doesn't feel like marketing.\"", body: "— Tom Fishburne\n\nSomething to remember when you're writing your next email sequence. If it reads like a sales pitch, rewrite it as a story.", sourceUrl: "https://example.com/fishburne-quote", sourceTitle: "Marketoonist" },
                ],
            },
            {
                digestNumber: 99,
                publishDay: PublishDay.FRIDAY,
                publishDate: new Date("2026-03-27"),
                status: DigestStatus.DRAFT,
                title: "FBM Digest #99",
                sections: [
                    { type: SectionType.EXPERT_TIP, heading: "", body: "" },
                    { type: SectionType.MARKETING_TIP, heading: "", body: "" },
                    { type: SectionType.COMMUNITY_SPOTLIGHT, heading: "", body: "" },
                    { type: SectionType.FUNNEL_OF_THE_WEEK, heading: "", body: "" },
                    { type: SectionType.FOOD_FOR_THOUGHT, heading: "", body: "" },
                ],
            },
        ];

        let digestsSeeded = 0;
        for (const seed of digestSeeds) {
            const { sections, ...digestData } = seed;
            // Skip if digest number already exists
            const existing = await prisma.digest.findUnique({
                where: { digestNumber: digestData.digestNumber },
            });
            if (existing) continue;

            const digest = await prisma.digest.create({
                data: {
                    ...digestData,
                    sections: {
                        create: sections.map((s, i) => ({
                            sectionType: s.type,
                            order: i + 1,
                            heading: s.heading || null,
                            body: s.body || null,
                            sourceUrl: ("sourceUrl" in s ? s.sourceUrl : null) as string | null,
                            sourceTitle: ("sourceTitle" in s ? s.sourceTitle : null) as string | null,
                        })),
                    },
                },
            });

            // Create DigestApproval records based on status
            if (digestData.status === DigestStatus.PUBLISHED) {
                await prisma.digestApproval.create({
                    data: {
                        digestId: digest.id,
                        userId,
                        role: "author",
                        approved: true,
                        approvedAt: digestData.publishedAt,
                    },
                });
            } else {
                // IN_REVIEW and DRAFT: create approval with approved=false
                await prisma.digestApproval.create({
                    data: {
                        digestId: digest.id,
                        userId,
                        role: "author",
                        approved: false,
                    },
                });
            }

            digestsSeeded++;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${discussionsToCreate.length} discussions, ${feedbackToCreate.length} feedback entries, and ${digestsSeeded} digests (${digestSeeds.length - digestsSeeded} skipped — already exist).`
        });

    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
