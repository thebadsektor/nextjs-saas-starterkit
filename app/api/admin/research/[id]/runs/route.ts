import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PublishDay } from "@/app/generated/prisma/client";

const MOCK_FINDINGS = [
  // Batch 1 (Monday)
  { order: 1, category: "MARKETING_STRATEGY", title: "How Short-Form Video Funnels Are Replacing Traditional Landing Pages", summary: "A new study from HubSpot shows that funnel builders using TikTok-style video landing pages see 3.2x higher conversion rates than static pages. The key: authenticity over polish.", sourceUrl: "https://blog.hubspot.com/marketing/video-funnels", sourceTitle: "HubSpot Marketing Blog" },
  { order: 2, category: "AI_TOOL", title: "Gamma AI: Create Pitch Decks and Sales Pages in Minutes", summary: "Gamma uses AI to turn a text prompt into a polished presentation or one-pager. Funnel builders are using it to create lead magnet previews and webinar slide decks without design skills.", sourceUrl: "https://gamma.app", sourceTitle: "Product Hunt" },
  { order: 3, category: "REAL_RESULTS", title: "Solo Funnel Builder Hits $50K MRR with a Single Webinar Funnel", summary: "ClickFunnels community member Rachel M. shared her results: one evergreen webinar funnel running on autopilot for 8 months, $50K monthly recurring revenue, $12 cost per lead via YouTube ads.", sourceUrl: "https://community.clickfunnels.com", sourceTitle: "ClickFunnels Community" },
  { order: 4, category: "QUOTE", title: "\"The riches are in the niches, but the fortune is in the follow-up.\"", summary: "— Amanda Holmes, CEO of Chet Holmes International. Speaking at Funnel Hacking Live about why most funnel builders leave money on the table by neglecting post-purchase sequences.", sourceUrl: "https://chethomesinternational.com", sourceTitle: "Funnel Hacking Live 2026" },
  { order: 5, category: "FUNNEL_TREND", title: "ClickFunnels Launches Native A/B Testing for Email Sequences", summary: "ClickFunnels just shipped a native split-testing feature for email follow-up sequences. You can now test subject lines, send times, and email content automatically without third-party tools.", sourceUrl: "https://www.clickfunnels.com/blog/category/announcements/", sourceTitle: "ClickFunnels Announcements" },
  // Batch 2 (Wednesday)
  { order: 6, category: "MARKETING_STRATEGY", title: "The 'Reverse Webinar' Strategy That's Converting at 22%", summary: "Instead of a 60-minute pitch, marketers are running 15-minute 'reverse webinars' where the audience asks questions first. Social Media Examiner reports 22% conversion rates vs 8% for traditional formats.", sourceUrl: "https://socialmediaexaminer.com/reverse-webinar", sourceTitle: "Social Media Examiner" },
  { order: 7, category: "AI_TOOL", title: "Eleven Labs Launches Conversational AI for Sales Funnels", summary: "Eleven Labs released a conversational AI agent that can handle objections, qualify leads, and book calls — all embedded in a funnel page. Early adopters report 40% more qualified leads.", sourceUrl: "https://elevenlabs.io", sourceTitle: "The Rundown AI" },
  { order: 8, category: "REAL_RESULTS", title: "From Course Creator to 7-Figure Agency Using One Funnel Template", summary: "FBM member David K. pivoted from selling his own course to building funnels for other course creators. Using a single proven template, he scaled to $1.2M in revenue in 14 months with a team of 3.", sourceUrl: "https://community.clickfunnels.com", sourceTitle: "FBM Community" },
  { order: 9, category: "QUOTE", title: "\"People don't buy products. They buy better versions of themselves.\"", summary: "— Samuel Thomas Davies, author of The One-Page Marketing Plan. A reminder that funnel copy should focus on transformation, not features.", sourceUrl: "https://samuelthomavies.com", sourceTitle: "Marketing Book Club" },
  { order: 10, category: "FUNNEL_TREND", title: "Quiz Funnels Are Outperforming Lead Magnets by 2.5x in 2026", summary: "New data from Typeform shows interactive quiz funnels convert at 45% vs 18% for traditional PDF lead magnets. The personalization of results pages is the key driver.", sourceUrl: "https://typeform.com/blog/quiz-funnels", sourceTitle: "Typeform Blog" },
  // Batch 3 (Friday)
  { order: 11, category: "MARKETING_STRATEGY", title: "Why 'Boring' Follow-Up Emails Outperform Fancy Ones", summary: "Neil Patel's latest analysis shows plain-text follow-up emails with no images get 2.1x higher reply rates than designed HTML emails. The lesson: make your automated emails feel personal.", sourceUrl: "https://neilpatel.com/blog/plain-text-emails", sourceTitle: "Neil Patel Blog" },
  { order: 12, category: "AI_TOOL", title: "Syllaby: AI Video Scripts for Every Stage of Your Funnel", summary: "Syllaby generates video scripts tailored to awareness, consideration, and decision stages of a funnel. Input your offer and it creates a full content calendar with scripts for 30 days.", sourceUrl: "https://syllaby.io", sourceTitle: "Ben's Bites" },
  { order: 13, category: "REAL_RESULTS", title: "How a Fitness Coach Filled a $2K Program with a $1 Trial Funnel", summary: "FBM member Ana S. offered a $1 for 7 days trial to her $2,000 coaching program. 340 trials started, 28% converted to full price. Total revenue: $190K from a $3,000 ad spend.", sourceUrl: "https://community.clickfunnels.com", sourceTitle: "FBM Community" },
  { order: 14, category: "QUOTE", title: "\"Your funnel is only as strong as your weakest follow-up.\"", summary: "— Alex Hormozi, on his podcast. Emphasizing that most revenue leaks happen after the opt-in, not before it.", sourceUrl: "https://acquisition.com/podcast", sourceTitle: "The Game Podcast" },
  { order: 15, category: "FUNNEL_TREND", title: "WhatsApp Business Funnels: The Next Frontier for ClickFunnels Users", summary: "ClickFunnels community members are reporting 60%+ open rates using WhatsApp Business as a follow-up channel alongside email. Integration via Zapier makes it plug-and-play.", sourceUrl: "https://www.clickfunnels.com/blog", sourceTitle: "ClickFunnels Blog" },
];

function getNextPublishDates(): Array<{ day: PublishDay; date: Date }> {
  const today = new Date();
  const dow = today.getDay();
  const targets = [
    { dayOfWeek: 1, publishDay: "MONDAY" as PublishDay },
    { dayOfWeek: 3, publishDay: "WEDNESDAY" as PublishDay },
    { dayOfWeek: 5, publishDay: "FRIDAY" as PublishDay },
  ];
  return targets.map(({ dayOfWeek, publishDay }) => {
    let daysAhead = dayOfWeek - dow;
    if (daysAhead <= 0) daysAhead += 7;
    const date = new Date(today);
    date.setDate(today.getDate() + daysAhead);
    date.setHours(9, 0, 0, 0);
    return { day: publishDay, date };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const research = await prisma.research.findUnique({ where: { id } });
    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    const runs = await prisma.researchRun.findMany({
      where: { researchId: id },
      orderBy: { createdAt: "desc" },
      include: {
        findings: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { articleSets: true },
        },
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Failed to list research runs:", error);
    return NextResponse.json({ error: "Failed to list research runs" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Fetch research with KB and section templates
    const research = await prisma.research.findUnique({
      where: { id },
      include: {
        knowledgeBase: true,
        sectionTemplates: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!research) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    if (research.sectionTemplates.length === 0) {
      return NextResponse.json(
        { error: "Research has no active section templates" },
        { status: 400 }
      );
    }

    // 2. Create ResearchRun with status=RUNNING
    const run = await prisma.researchRun.create({
      data: {
        researchId: id,
        status: "RUNNING",
        searchWindowDays: research.searchWindowDays,
        startedAt: new Date(),
        promptUsed: "MOCK_RESEARCH_RUN — simulated pipeline for POC",
      },
    });

    // 3-4. Create 15 MOCK findings
    await prisma.researchFinding.createMany({
      data: MOCK_FINDINGS.map((f) => ({
        runId: run.id,
        order: f.order,
        category: f.category,
        title: f.title,
        summary: f.summary,
        sourceUrl: f.sourceUrl,
        sourceTitle: f.sourceTitle,
      })),
    });

    // Re-fetch findings to get their IDs
    const findings = await prisma.researchFinding.findMany({
      where: { runId: run.id },
      orderBy: { order: "asc" },
    });

    // 5. Compute next Mon/Wed/Fri dates from today
    const publishDates = getNextPublishDates();

    // 6. Get next digest number (MAX + 1)
    const maxDigest = await prisma.digest.aggregate({
      _max: { digestNumber: true },
    });
    let nextDigestNumber = (maxDigest._max.digestNumber ?? 0) + 1;

    // 7. For each batch of 5 findings (3 batches), create digest + articles
    const createdDigests = [];
    const batches = [
      findings.slice(0, 5),
      findings.slice(5, 10),
      findings.slice(10, 15),
    ];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const { day, date } = publishDates[i];

      // Create Digest (DRAFT)
      const digest = await prisma.digest.create({
        data: {
          digestNumber: nextDigestNumber,
          publishDay: day,
          publishDate: date,
          status: "DRAFT",
          title: `FBM Digest #${nextDigestNumber}`,
          teamId: research.teamId,
        },
      });

      // Create ArticleSet (EMPTY) linked to digest + run
      const articleSet = await prisma.articleSet.create({
        data: {
          digestId: digest.id,
          runId: run.id,
          status: "EMPTY",
        },
      });

      // Create 5 Articles linked to findings + section templates
      for (let j = 0; j < batch.length; j++) {
        const finding = batch[j];
        // Match finding to section template by index (templates are ordered)
        const template = research.sectionTemplates[j] || null;

        await prisma.article.create({
          data: {
            articleSetId: articleSet.id,
            findingId: finding.id,
            sectionTemplateId: template?.id || null,
            order: j + 1,
            heading: finding.title,
            sourceUrl: finding.sourceUrl,
            sourceTitle: finding.sourceTitle,
            status: "EMPTY",
          },
        });

        // Mark finding as used
        await prisma.researchFinding.update({
          where: { id: finding.id },
          data: { used: true },
        });
      }

      // Create DigestApproval for the current user (author)
      await prisma.digestApproval.create({
        data: {
          digestId: digest.id,
          userId: session.user.id,
          role: "author",
          approved: false,
        },
      });

      // Auto-add default reviewers (Lee as reviewer, Hanna as proofreader)
      const defaultReviewers = [
        { email: "lee@fbmdigest.com", role: "reviewer" },
        { email: "hanna@fbmdigest.com", role: "proofreader" },
      ];
      for (const reviewer of defaultReviewers) {
        const user = await prisma.user.findFirst({ where: { email: reviewer.email } });
        if (user && user.id !== session.user.id) {
          await prisma.digestApproval.create({
            data: {
              digestId: digest.id,
              userId: user.id,
              role: reviewer.role,
              approved: false,
            },
          }).catch(() => {}); // Skip if already exists
        }
      }

      createdDigests.push({
        digestId: digest.id,
        digestNumber: nextDigestNumber,
        publishDay: day,
        publishDate: date,
        articleSetId: articleSet.id,
      });

      nextDigestNumber++;
    }

    // 8. Set run status=COMPLETED
    await prisma.researchRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 9. Append finding titles to KB.previousTopics
    const findingTitles = findings.map((f) => f.title);
    await prisma.knowledgeBase.update({
      where: { id: research.knowledgeBaseId },
      data: {
        previousTopics: [
          ...research.knowledgeBase.previousTopics,
          ...findingTitles,
        ],
      },
    });

    // 10. Return run with created digests
    const completedRun = await prisma.researchRun.findUnique({
      where: { id: run.id },
      include: {
        findings: { orderBy: { order: "asc" } },
        articleSets: {
          include: {
            digest: {
              include: {
                approvals: true,
              },
            },
            articles: {
              orderBy: { order: "asc" },
              include: {
                sectionTemplate: true,
                finding: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { run: completedRun, createdDigests },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to trigger research run:", error);
    return NextResponse.json(
      { error: "Failed to trigger research run" },
      { status: 500 }
    );
  }
}
