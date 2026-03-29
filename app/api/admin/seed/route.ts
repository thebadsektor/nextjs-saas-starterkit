import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PublishDay, DigestStatus, ArticleStatus } from "@/app/generated/prisma/client";

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

// Section template definitions
const SECTION_TEMPLATES = [
    {
        key: "expert_tip",
        name: "FBM Expert Tip",
        order: 1,
        findingCategory: "expert_tip",
        promptTemplate: `You are writing the "FBM Expert Tip" section for the FBM Digest newsletter.
Write a marketing or growth strategy tip in 2-3 short paragraphs.
Voice: {{BRAND_VOICE}}
Use contractions (it's, you're, don't). Second person (you/your). Short paragraphs (2-3 sentences max).
End with a practical action the reader can take this week.
Format as properly structured HTML: wrap every paragraph in <p> tags, use <ul>/<li> for any lists (never bare text lines), <strong> for bold, <em> for italic, <blockquote> for quotes. No markdown.
Do NOT include any section headers — just the body content.`,
    },
    {
        key: "marketing_tip",
        name: "Marketing Tip of the Week",
        order: 2,
        findingCategory: "marketing_tip",
        promptTemplate: `You are writing the "Marketing Tip of the Week" section for the FBM Digest newsletter.
Write about a practical AI tool or productivity hack in under 150 words.
Voice: {{BRAND_VOICE}}
Include the specific benefit or result if possible.
End with one clear action step the reader can take this week, starting with "Action step:".
Format as properly structured HTML: wrap every paragraph in <p> tags, use <ul>/<li> for any lists (never bare text lines), <strong> for bold, <em> for italic, <blockquote> for quotes. No markdown.
Do NOT include any section headers — just the body content.`,
    },
    {
        key: "community_spotlight",
        name: "Community Spotlight",
        order: 3,
        findingCategory: "community_spotlight",
        promptTemplate: `You are writing the "Community Spotlight" section for the FBM Digest newsletter.
Frame this as a success story from a ClickFunnels/funnel builder community member.
Lead with the result (numbers, revenue, growth), then explain how they achieved it.
Voice: {{BRAND_VOICE}} Sharing something too good not to pass along.
Make it feel authentic and relatable. Use a realistic first name.
Format as properly structured HTML: wrap every paragraph in <p> tags, use <ul>/<li> for any lists (never bare text lines), <strong> for bold, <em> for italic, <blockquote> for quotes. No markdown.
Do NOT include any section headers — just the body content.`,
    },
    {
        key: "funnel_of_the_week",
        name: "Funnel of the Week",
        order: 4,
        findingCategory: "funnel_of_the_week",
        promptTemplate: `You are writing the "Funnel of the Week" section for the FBM Digest newsletter.
Describe a funnel strategy in plain English — no jargon.
Include 2-3 observations or elements the reader can steal for their own funnel.
Voice: {{BRAND_VOICE}} Breaking down what works and why.
End with exactly this line: "Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com"
Format as properly structured HTML: wrap every paragraph in <p> tags, use <ul>/<li> for any lists (never bare text lines), <strong> for bold, <em> for italic, <blockquote> for quotes. No markdown.
Do NOT include any section headers — just the body content.`,
    },
    {
        key: "food_for_thought",
        name: "Food for Thought",
        order: 5,
        findingCategory: "food_for_thought",
        promptTemplate: `You are writing the "Food for Thought" section for the FBM Digest newsletter.
Provide an inspiring business or marketing quote, properly attributed.
Format: Start with the quote in quotation marks, then "— [Author Name]" on the next line.
Then add 1-2 sentences connecting the quote to funnel building or marketing.
Voice: {{BRAND_VOICE}} Reflective and encouraging.
Format as properly structured HTML: wrap every paragraph in <p> tags, use <ul>/<li> for any lists (never bare text lines), <strong> for bold, <em> for italic, <blockquote> for quotes. No markdown.
Do NOT include any section headers — just the body content.`,
    },
];

// Seed article content per digest, keyed by section template key
const DIGEST_ARTICLES: Record<string, { heading: string; body: string; sourceUrl?: string; sourceTitle?: string }[]> = {
    "94": [
        { heading: "The 3-Step Funnel That Converts Cold Traffic", body: "<p>Russell Brunson shared a surprisingly simple funnel structure on his podcast this week. The idea is to use a short quiz as the entry point, followed by a personalized results page, then a tailored offer. The key insight? Personalization at the results stage increased opt-ins by <strong>47%</strong> compared to a standard lead magnet page.</p><p>If you're running paid traffic, this is worth testing. Start with 3-5 quiz questions that segment your audience by their biggest challenge, then serve different copy on the results page based on their answers.</p>", sourceUrl: "https://example.com/russell-quiz-funnel", sourceTitle: "Russell Brunson Podcast Episode 423" },
        { heading: "Try Castmagic for Repurposing Your Content", body: "<p>Castmagic is an AI tool that turns any audio or video into blog posts, social captions, email sequences, and more. Upload a webinar recording and it generates a week's worth of content in minutes.</p><p><strong>Action step:</strong> Record your next funnel walkthrough, upload it to Castmagic, and use the output for 5 social posts this week.</p>", sourceUrl: "https://example.com/castmagic", sourceTitle: "Product Hunt — Castmagic" },
        { heading: "Community Win: $23K Launch with a Simple Tripwire", body: "<p>FBM member Sarah K. shared her launch results in the community this week. She used a <strong>$7 tripwire</strong> ebook leading into a <strong>$297 course</strong> upsell. The numbers: 1,200 tripwire sales, 19% took the upsell, totaling <strong>$23,166</strong> in the first 5 days.</p><p>The takeaway? Don't underestimate low-ticket entry offers. They build trust fast and the upsell conversion was nearly <strong>4x</strong> what she expected.</p>", sourceUrl: "https://example.com/community-win", sourceTitle: "FBM Community Forum" },
        { heading: "Webinar Funnel Teardown: How Alex Hormozi Fills Rooms", body: "<p>This week we're looking at the registration funnel Hormozi's team uses for their live workshops. Three things stand out: the countdown timer creates urgency without feeling fake, the social proof section shows real business owners (not stock photos), and the post-registration page immediately offers a free resource.</p><p>Steal-worthy moves: Add a \"what you'll learn\" bullet list (not features, outcomes), use a 2-step opt-in, and always have a valuable next step after registration.</p><p>Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com</p>", sourceUrl: "https://example.com/hormozi-funnel", sourceTitle: "Funnel Teardown Analysis" },
        { heading: "\"The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.\"", body: "<blockquote><p>\"The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.\"</p></blockquote><p><em>— Simon Sinek</em></p><p>This one hit home for me this week. Sometimes we chase every lead when we should be attracting the right ones. Your funnel copy should repel as much as it attracts.</p>", sourceUrl: "https://example.com/sinek-quote", sourceTitle: "Start With Why" },
    ],
    "95": [
        { heading: "The 5-Email Welcome Sequence That Builds Trust Fast", body: "<p>Neil Patel published a breakdown of the ideal welcome email sequence this week. The formula: Email 1 delivers the lead magnet, Email 2 shares your story, Email 3 provides unexpected value, Email 4 introduces a soft CTA, Email 5 makes the offer.</p><p>The key insight is <strong>Email 3</strong> — giving something valuable they didn't ask for builds reciprocity and trust before you ever pitch.</p>", sourceUrl: "https://example.com/neil-patel-emails", sourceTitle: "Neil Patel Blog" },
        { heading: "Use Opus Clip to Turn Long Videos into Shorts", body: "<p>Opus Clip uses AI to find the most engaging moments in your long-form videos and turns them into short-form clips. Perfect for repurposing webinar replays into social content.</p><p><strong>Action step:</strong> Upload your last webinar recording and create 3 clips for Instagram Reels or TikTok this week.</p>", sourceUrl: "https://example.com/opus-clip", sourceTitle: "Opus Clip" },
        { heading: "From Zero to 500 Subscribers in 14 Days", body: "<p>Mike R. from the FBM community shared how he built his email list from scratch using a simple squeeze page and <strong>$200</strong> in Facebook ads. His secret? A hyper-specific lead magnet targeting one pain point for real estate agents.</p><p>Cost per lead: <strong>$0.40</strong>. That's the power of niching down.</p>", sourceUrl: "https://example.com/mike-case-study", sourceTitle: "FBM Community Forum" },
        { heading: "Challenge Funnel: 5-Day Format That Converts", body: "<p>Challenge funnels are having a moment. The structure is simple: free 5-day challenge, daily email with a quick win, Day 5 pitch to a paid program. What makes it work is the micro-commitments — each day's task builds investment.</p><p>Three things to steal: Keep daily tasks under 15 minutes, use a private Facebook group for accountability, and make <strong>Day 3</strong> the biggest value bomb.</p><p>Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com</p>", sourceUrl: "https://example.com/challenge-funnel", sourceTitle: "Challenge Funnel Blueprint" },
        { heading: "\"Your most unhappy customers are your greatest source of learning.\"", body: "<blockquote><p>\"Your most unhappy customers are your greatest source of learning.\"</p></blockquote><p><em>— Bill Gates</em></p><p>Worth remembering when you get that negative email or refund request. There's gold in the feedback if you're willing to dig.</p>", sourceUrl: "https://example.com/gates-quote", sourceTitle: "Business @ The Speed of Thought" },
    ],
    "96": [
        { heading: "Why Long-Form Sales Pages Still Outperform Short Ones", body: "<p>HubSpot released data this week showing that long-form sales pages (2,000+ words) convert <strong>30% better</strong> than short pages for products over $100. The reason? Higher-priced purchases need more objection handling.</p><p>The formula: Lead with the transformation, stack proof in the middle, handle objections before the CTA. Don't be afraid of length — be afraid of boring copy.</p>", sourceUrl: "https://example.com/hubspot-long-form", sourceTitle: "HubSpot Marketing Blog" },
        { heading: "Perplexity AI for Market Research", body: "<p>Perplexity AI is becoming a secret weapon for funnel builders. Ask it to research your competitor's positioning, find trending topics in your niche, or summarize customer reviews.</p><p><strong>Action step:</strong> Ask Perplexity 'What are the top 5 complaints people have about [your niche] courses?' and use the answers in your sales copy.</p>", sourceUrl: "https://example.com/perplexity", sourceTitle: "Perplexity AI" },
        { heading: "How One Member Doubled Her Course Price (and Sold More)", body: "<p>FBM member Lisa T. raised her course price from <strong>$197 to $397</strong> after adding a live Q&A component. Result: Sales actually increased by <strong>15%</strong> while revenue doubled. Higher prices signal higher value.</p><p>The lesson: Before you discount, consider what you can <em>add</em> to justify a higher price.</p>", sourceUrl: "https://example.com/lisa-pricing", sourceTitle: "FBM Community Forum" },
        { heading: "The 'Invisible Funnel': Free First, Pay Later", body: "<p>The invisible funnel lets people consume your content before they pay. Structure: Free training → checkout page appears after they've watched 80% → they only pay if they found it valuable.</p><p>Why it works: Removes all risk for the buyer. Russell Brunson popularized this and reports <strong>60%+ conversion rates</strong> because the value is proven before the ask.</p><p>Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com</p>", sourceUrl: "https://example.com/invisible-funnel", sourceTitle: "ClickFunnels Blog" },
        { heading: "\"Don't find customers for your products, find products for your customers.\"", body: "<blockquote><p>\"Don't find customers for your products, find products for your customers.\"</p></blockquote><p><em>— Seth Godin</em></p><p>This is the funnel builder's mantra. Build the funnel around what your audience actually needs, not what you want to sell.</p>", sourceUrl: "https://example.com/godin-quote", sourceTitle: "Seth Godin's Blog" },
    ],
    "97": [
        { heading: "The Soap Opera Email Sequence Explained", body: "<p>If you've read <em>DotCom Secrets</em>, you know about the Soap Opera Sequence. This week, Alex Cattoni broke it down in a new video with modern examples.</p><p>The 5 emails: <strong>Set the stage</strong>, create high drama, share the epiphany, reveal hidden benefits, deliver urgency. Each email ends on a cliffhanger that makes them open the next one.</p>", sourceUrl: "https://example.com/soap-opera-emails", sourceTitle: "Alex Cattoni YouTube" },
        { heading: "Claude for Writing Funnel Copy That Sounds Human", body: "<p>Claude (by Anthropic) is becoming the go-to AI for funnel copy because it handles tone and voice better than alternatives. The trick is giving it a reference sample of your writing first.</p><p><strong>Action step:</strong> Paste 3 of your best emails into Claude and ask it to write your next email in the same voice.</p>", sourceUrl: "https://example.com/claude-copy", sourceTitle: "The Rundown AI" },
        { heading: "First Funnel, First $10K Month", body: "<p>New FBM member James D. hit <strong>$10K</strong> in his first month using a simple opt-in → tripwire → core offer funnel. He spent $500 on ads and focused on one audience: local gym owners.</p><p>His advice: 'Stop trying to sell to everyone. Pick <strong>one person</strong> and build the entire funnel for them.'</p>", sourceUrl: "https://example.com/james-10k", sourceTitle: "FBM Community Forum" },
        { heading: "ClickFunnels 2.0 Blog Funnel: Content That Converts", body: "<p>ClickFunnels just shipped a blog funnel template that turns content readers into leads. The structure: SEO blog post → in-content CTA → lead magnet popup → nurture sequence.</p><p>Key features: Built-in A/B testing on CTAs, automatic lead tagging based on which post they read, and seamless handoff to your email sequence.</p><p>Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com</p>", sourceUrl: "https://www.clickfunnels.com/blog/category/announcements/", sourceTitle: "ClickFunnels Announcements" },
        { heading: "\"Revenue is vanity, profit is sanity, but cash flow is reality.\"", body: "<blockquote><p>\"Revenue is vanity, profit is sanity, but cash flow is reality.\"</p></blockquote><p><em>— Unknown</em></p><p>As you scale your funnels, keep an eye on the numbers that actually matter. A $100K launch means nothing if your ad spend ate it all.</p>", sourceUrl: "https://example.com/cashflow-quote", sourceTitle: "Business Wisdom" },
    ],
    "98": [
        { heading: "Retargeting Warm Audiences: The 3-Touch Framework", body: "<p>Social Media Examiner published a guide on retargeting that's worth your time. The framework: Touch 1 is a testimonial video, Touch 2 is an objection-handling post, Touch 3 is a direct offer with urgency.</p><p>The data shows this 3-touch sequence converts <strong>5x better</strong> than sending the same ad repeatedly.</p>", sourceUrl: "https://example.com/retargeting", sourceTitle: "Social Media Examiner" },
        { heading: "Descript: Edit Video Like a Google Doc", body: "<p>Descript lets you edit video by editing the transcript text. Delete a sentence from the text, and the video cuts automatically. Perfect for cleaning up webinar recordings.</p><p><strong>Action step:</strong> Record a 10-minute funnel walkthrough, clean it up in Descript, and use it as a lead magnet.</p>", sourceUrl: "https://example.com/descript", sourceTitle: "Descript" },
        { heading: "Turning Refund Requests into Testimonials", body: "<p>FBM member Priya S. shared a clever approach: when someone requests a refund, she offers a free 15-minute call to help them get results instead. <strong>60%</strong> of people accept, and half of those become her biggest advocates.</p><p>'Refund requests are just people saying they need more help,' she says.</p>", sourceUrl: "https://example.com/priya-refunds", sourceTitle: "FBM Community Forum" },
        { heading: "The Thank You Page Upsell That Adds 30% Revenue", body: "<p>Most funnel builders ignore the thank you page. Big mistake. Add a one-time offer immediately after opt-in and you can capture buyers at their most engaged moment.</p><p>Best practices: Keep it under $47, make it complementary to the lead magnet, and use a countdown timer for urgency.</p><p>Want a funnel like this built for your business? Send us a message here → funnelbuildermarketplace.com</p>", sourceUrl: "https://example.com/thank-you-upsell", sourceTitle: "Funnel Strategy Guide" },
        { heading: "\"The best marketing doesn't feel like marketing.\"", body: "<blockquote><p>\"The best marketing doesn't feel like marketing.\"</p></blockquote><p><em>— Tom Fishburne</em></p><p>Something to remember when you're writing your next email sequence. If it reads like a sales pitch, rewrite it as a story.</p>", sourceUrl: "https://example.com/fishburne-quote", sourceTitle: "Marketoonist" },
    ],
    "99": [
        { heading: "", body: "" },
        { heading: "", body: "" },
        { heading: "", body: "" },
        { heading: "", body: "" },
        { heading: "", body: "" },
    ],
};

// Sample research findings
const SAMPLE_FINDINGS = [
    { category: "expert_tip", title: "Quiz Funnels for Cold Traffic", summary: "Russell Brunson shared a quiz-based funnel structure that increased opt-ins by 47%.", sourceUrl: "https://example.com/russell-quiz-funnel" },
    { category: "expert_tip", title: "Welcome Email Sequence", summary: "Neil Patel's 5-email welcome sequence formula builds trust before pitching.", sourceUrl: "https://example.com/neil-patel-emails" },
    { category: "expert_tip", title: "Long-Form Sales Pages", summary: "HubSpot data shows 2,000+ word pages convert 30% better for $100+ products.", sourceUrl: "https://example.com/hubspot-long-form" },
    { category: "marketing_tip", title: "Castmagic AI Tool", summary: "Turns audio/video into blog posts, social captions, and email sequences.", sourceUrl: "https://example.com/castmagic" },
    { category: "marketing_tip", title: "Opus Clip for Shorts", summary: "AI finds engaging moments in long videos and creates short-form clips.", sourceUrl: "https://example.com/opus-clip" },
    { category: "marketing_tip", title: "Perplexity AI Research", summary: "Use Perplexity for competitor research and customer pain point discovery.", sourceUrl: "https://example.com/perplexity" },
    { category: "community_spotlight", title: "$23K Tripwire Launch", summary: "Sarah K. generated $23,166 in 5 days with a $7 tripwire into a $297 course.", sourceUrl: "https://example.com/community-win" },
    { category: "community_spotlight", title: "500 Subscribers in 14 Days", summary: "Mike R. built his list with a squeeze page and $200 in Facebook ads.", sourceUrl: "https://example.com/mike-case-study" },
    { category: "community_spotlight", title: "Course Price Doubling", summary: "Lisa T. raised price from $197 to $397 and saw sales increase by 15%.", sourceUrl: "https://example.com/lisa-pricing" },
    { category: "funnel_of_the_week", title: "Hormozi Workshop Funnel", summary: "Registration funnel with countdown timer, real social proof, and post-reg resources.", sourceUrl: "https://example.com/hormozi-funnel" },
    { category: "funnel_of_the_week", title: "5-Day Challenge Funnel", summary: "Free challenge with daily quick wins leading to paid program on Day 5.", sourceUrl: "https://example.com/challenge-funnel" },
    { category: "funnel_of_the_week", title: "Invisible Funnel", summary: "Free training with payment only after 80% consumption — 60%+ conversion.", sourceUrl: "https://example.com/invisible-funnel" },
    { category: "food_for_thought", title: "Simon Sinek Quote", summary: "The goal is to do business with people who believe what you believe.", sourceUrl: "https://example.com/sinek-quote" },
    { category: "food_for_thought", title: "Bill Gates Quote", summary: "Your most unhappy customers are your greatest source of learning.", sourceUrl: "https://example.com/gates-quote" },
    { category: "food_for_thought", title: "Seth Godin Quote", summary: "Don't find customers for your products, find products for your customers.", sourceUrl: "https://example.com/godin-quote" },
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

        // ── Seed Test Users ──
        const testUsers = [
            { name: "Lee Chapman", email: "lee@fbmdigest.com", password: "FBMDigest2026!" },
            { name: "Hanna Mae Rico", email: "hanna@fbmdigest.com", password: "FBMDigest2026!" },
        ];
        let usersSeeded = 0;
        for (const u of testUsers) {
            const existing = await prisma.user.findFirst({ where: { email: u.email } });
            if (existing) continue;
            try {
                await auth.api.signUpEmail({
                    body: { email: u.email, password: u.password, name: u.name },
                });
                // Mark email as verified so they can log in immediately
                await prisma.user.updateMany({
                    where: { email: u.email },
                    data: { emailVerified: true },
                });
                usersSeeded++;
            } catch (e) {
                console.error(`Failed to create user ${u.email}:`, e);
            }
        }

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

        // ── Create KnowledgeBase ──
        const kb = await prisma.knowledgeBase.create({
            data: {
                name: "FBM Digest Knowledge Base",
                brandVoice: "a friendly, experienced funnel and marketing expert. Warm, conversational, like a friend sharing advice.",
                sourceUrls: [
                    "https://www.clickfunnels.com/blog",
                    "https://funnelbuildermarketplace.com",
                    "https://socialmediaexaminer.com",
                    "https://neilpatel.com/blog",
                    "https://blog.hubspot.com/marketing",
                ],
                previousTopics: [
                    "quiz funnels", "email welcome sequences", "tripwire offers",
                    "challenge funnels", "invisible funnels", "retargeting",
                ],
            },
        });

        // ── Create Research config ──
        const research = await prisma.research.create({
            data: {
                knowledgeBaseId: kb.id,
                name: "FBM Weekly Digest Research",
                description: "Automated research pipeline for the FBM Digest newsletter",
                searchWindowDays: 10,
                minFindings: 15,
                reRunOnFailure: true,
            },
        });

        // ── Create SectionTemplates ──
        const createdTemplates = [];
        for (const tmpl of SECTION_TEMPLATES) {
            const t = await prisma.sectionTemplate.create({
                data: {
                    researchId: research.id,
                    name: tmpl.name,
                    key: tmpl.key,
                    order: tmpl.order,
                    findingCategory: tmpl.findingCategory,
                    promptTemplate: tmpl.promptTemplate,
                    isActive: true,
                },
            });
            createdTemplates.push(t);
        }

        // ── Create a completed ResearchRun with findings ──
        const run = await prisma.researchRun.create({
            data: {
                researchId: research.id,
                status: "COMPLETED",
                searchWindowDays: 10,
                startedAt: new Date("2026-03-15T08:00:00Z"),
                completedAt: new Date("2026-03-15T08:05:00Z"),
            },
        });

        await prisma.researchFinding.createMany({
            data: SAMPLE_FINDINGS.map((f, i) => ({
                runId: run.id,
                order: i + 1,
                category: f.category,
                title: f.title,
                summary: f.summary,
                sourceUrl: f.sourceUrl,
                used: true,
            })),
        });

        // ── Seed Digests ──
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
                articleStatus: ArticleStatus.APPROVED,
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
                articleStatus: ArticleStatus.APPROVED,
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
                articleStatus: ArticleStatus.APPROVED,
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
                articleStatus: ArticleStatus.APPROVED,
            },
            {
                digestNumber: 98,
                publishDay: PublishDay.WEDNESDAY,
                publishDate: new Date("2026-03-25"),
                status: DigestStatus.IN_REVIEW,
                title: "FBM Digest #98",
                subjectLine: "FBM Digest #98: Retargeting secrets, community spotlight, and more...",
                preHeader: "Midweek marketing boost",
                articleStatus: ArticleStatus.GENERATED,
            },
            {
                digestNumber: 99,
                publishDay: PublishDay.FRIDAY,
                publishDate: new Date("2026-03-27"),
                status: DigestStatus.DRAFT,
                title: "FBM Digest #99",
                articleStatus: ArticleStatus.EMPTY,
            },
        ];

        let digestsSeeded = 0;
        for (const seed of digestSeeds) {
            const { articleStatus, ...digestData } = seed;

            // Skip if digest number already exists
            const existing = await prisma.digest.findUnique({
                where: { digestNumber: digestData.digestNumber },
            });
            if (existing) continue;

            const digest = await prisma.digest.create({
                data: digestData,
            });

            // Create ArticleSet
            const articleSet = await prisma.articleSet.create({
                data: {
                    digestId: digest.id,
                    runId: run.id,
                    status: articleStatus === ArticleStatus.APPROVED
                        ? "EDITED"
                        : articleStatus === ArticleStatus.GENERATED
                            ? "GENERATED"
                            : "EMPTY",
                },
            });

            // Create Articles from seed content
            const articles = DIGEST_ARTICLES[String(digestData.digestNumber)] || [];
            for (let i = 0; i < createdTemplates.length; i++) {
                const articleContent = articles[i] || { heading: "", body: "" };
                await prisma.article.create({
                    data: {
                        articleSetId: articleSet.id,
                        sectionTemplateId: createdTemplates[i].id,
                        order: i + 1,
                        heading: articleContent.heading || null,
                        body: articleContent.body || null,
                        sourceUrl: articleContent.sourceUrl || null,
                        sourceTitle: articleContent.sourceTitle || null,
                        status: articleStatus,
                        generatedAt: articleStatus !== ArticleStatus.EMPTY ? new Date() : null,
                    },
                });
            }

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
            message: `Successfully seeded ${usersSeeded} test users, ${discussionsToCreate.length} discussions, ${feedbackToCreate.length} feedback entries, and ${digestsSeeded} digests (${digestSeeds.length - digestsSeeded} skipped — already exist). Also created KnowledgeBase, Research config with ${createdTemplates.length} section templates, and ${SAMPLE_FINDINGS.length} research findings.`
        });

    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
