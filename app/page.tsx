"use client";

import Link from "next/link";
import {
    ArrowRight,
    Lightning,
    CheckCircle,
    Star,
    ChatCircleText,
    Users,
    Lightbulb,
    TrendUp,
    Cpu,
    Megaphone,
    Command
} from "@phosphor-icons/react";
import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";
import { motion } from "framer-motion";
import { saasMeta } from "@/lib/constants";

const digestSections = [
    {
        name: "FBM Expert Tip",
        description: "Proven marketing and growth strategies from top funnel experts.",
        icon: <Lightbulb size={24} weight="duotone" className="text-amber-500" />,
    },
    {
        name: "Marketing Tip of the Week",
        description: "The latest AI tools and productivity hacks to work smarter.",
        icon: <Cpu size={24} weight="duotone" className="text-indigo-500" />,
    },
    {
        name: "Community Spotlight",
        description: "Real results from fellow funnel builders in the ClickFunnels community.",
        icon: <Users size={24} weight="duotone" className="text-emerald-500" />,
    },
    {
        name: "Funnel of the Week",
        description: "Funnel breakdowns you can steal for your own business.",
        icon: <TrendUp size={24} weight="duotone" className="text-sky-500" />,
    },
    {
        name: "Food for Thought",
        description: "Inspiring quotes and insights to fuel your entrepreneurial mindset.",
        icon: <Star size={24} weight="duotone" className="text-rose-500" />,
    },
    {
        name: "Curated Sources",
        description: "Sourced from HubSpot, Neil Patel, Product Hunt, Social Media Examiner, and more.",
        icon: <Megaphone size={24} weight="duotone" className="text-orange-500" />,
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1
    }
};

export default function LandingPage() {
    return (
        <div className="flex flex-col gap-24 py-12 overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-5%] left-1/4 w-[600px] h-[600px] bg-primary/20 blur-[130px] rounded-full animate-pulse opacity-50"></div>
                <div className="absolute top-[15%] right-1/4 w-[500px] h-[500px] bg-indigo-500/20 blur-[110px] rounded-full animate-pulse delay-700 opacity-50"></div>
            </div>

            {/* Hero Section */}
            <section className="relative text-center space-y-10 max-w-5xl mx-auto px-6 pt-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2.5 px-5 py-2 rounded-2xl bg-primary/5 border border-primary/10 text-primary text-xs font-bold tracking-widest uppercase shadow-sm"
                >
                    <Command weight="bold" />
                    <span>Your Weekly Marketing Edge</span>
                </motion.div>

                <div className="space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-foreground"
                    >
                        Grow your funnels <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-indigo-400">3x per week.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                    >
                        Curated marketing strategies, AI tools, and real funnel results — delivered every Monday, Wednesday, and Friday. Built for ClickFunnels users and online entrepreneurs who want actionable insights, not fluff.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-5"
                >
                    <SignedIn>
                        <Link
                            href="/dashboard"
                            className="group relative flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(var(--primary),0.2)] hover:-translate-y-1 active:scale-95"
                        >
                            Open Dashboard
                            <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </SignedIn>
                    <SignedOut>
                        <Link
                            href="/auth/sign-up"
                            className="group relative flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:shadow-[0_0_40px_rgba(var(--primary),0.2)] hover:-translate-y-1 active:scale-95"
                        >
                            Subscribe to FBM Digest
                            <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </SignedOut>
                    <Link
                        href="#whats-inside"
                        className="flex items-center gap-3 bg-card border border-border px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:bg-muted/50 hover:border-border hover:-translate-y-1 active:scale-95 shadow-lg"
                    >
                        See What's Inside
                    </Link>
                </motion.div>

                {/* Trusted Sources - Marquee style feel */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="pt-16 flex flex-wrap justify-center items-center gap-x-10 gap-y-6 opacity-30 font-mono text-xs uppercase tracking-[0.2em] font-bold"
                >
                    <span>Mon / Wed / Fri</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                    <span>ClickFunnels</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                    <span>Marketing</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                    <span>AI Tools</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-border"></div>
                    <span>Funnels</span>
                </motion.div>
            </section>

            {/* What's Inside Grid */}
            <section id="whats-inside" className="container max-w-7xl mx-auto px-6 space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">Every Edition, Packed With Value.</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        Each digest brings you the week's best marketing insights, hand-picked from top sources and the funnel builder community.
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {digestSections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="group p-8 rounded-[2rem] border bg-card/40 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 border-border/50 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="text-8xl font-black select-none pointer-events-none">{idx + 1}</span>
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="p-4 bg-primary/5 w-fit rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-primary/10">
                                    {section.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight">{section.name}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Built for Funnel Builders Section */}
            <section className="container max-w-7xl mx-auto px-6">
                <div className="relative bg-zinc-950 p-10 md:p-24 rounded-[3.5rem] overflow-hidden border border-white/[0.05] shadow-3xl">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[180px] -mr-[400px] -mt-[400px] rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[180px] -ml-[400px] -mb-[400px] rounded-full"></div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-3 text-primary font-mono text-xs uppercase tracking-[0.3em] font-black">
                                <span className="block h-[1px] w-12 bg-current"></span>
                                Focus on building
                            </div>
                            <h2 className="text-4xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter">
                                Built for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600 italic">Funnel Builders.</span>
                            </h2>
                            <p className="text-zinc-400 text-xl leading-relaxed max-w-md font-medium">
                                Stop spending hours hunting for marketing tips. We research, curate, and deliver the best insights so you can focus on building funnels that convert.
                            </p>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <div className="text-white text-4xl font-black tabular-nums">3x</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Weekly Editions</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-white text-4xl font-black tabular-nums">15+</div>
                                    <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Curated Insights Per Week</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] p-1 border border-white/[0.05] shadow-premium group">
                            <div className="bg-[#0b0b0e] rounded-[2.2rem] p-4 md:p-8 space-y-6">
                                <div className="flex items-center justify-between text-zinc-600 border-b border-white/[0.03] pb-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <ChatCircleText size={18} />
                                        <span className="text-xs font-mono font-bold uppercase tracking-widest">This Week's Digest</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-800"></div>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <span className="text-zinc-300 font-bold text-xs">FBM Expert Tip</span>
                                            <p className="text-zinc-500 text-xs mt-1">Growth strategy breakdown</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <span className="text-zinc-300 font-bold text-xs">Marketing Tip of the Week</span>
                                            <p className="text-zinc-500 text-xs mt-1">New AI tool spotlight</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <span className="text-zinc-300 font-bold text-xs">Community Spotlight</span>
                                            <p className="text-zinc-500 text-xs mt-1">Real results from a member</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <span className="text-zinc-300 font-bold text-xs">Funnel of the Week</span>
                                            <p className="text-zinc-500 text-xs mt-1">Steal-worthy funnel teardown</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                                        <div>
                                            <span className="text-zinc-300 font-bold text-xs">Food for Thought</span>
                                            <p className="text-zinc-500 text-xs mt-1">Quote to fuel your week</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/[0.03]">
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs text-zinc-400 font-bold tracking-wide uppercase">Monday Edition</span>
                                    </div>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-xs text-zinc-400 font-bold tracking-wide uppercase">Wednesday Edition</span>
                                    </div>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                        <span className="text-xs text-zinc-400 font-bold tracking-wide uppercase">Friday Edition</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="container max-w-4xl mx-auto px-6 text-center py-20">
                <div className="space-y-12 bg-gradient-to-b from-card to-background p-16 rounded-[4rem] border border-border/40 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/[0.02] -z-10"></div>
                    <div className="space-y-6">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                            Ready to grow? <br />
                            <span className="text-primary italic">Your next funnel breakthrough is one digest away.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground font-medium">
                            Join thousands of funnel builders getting smarter every week.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Link
                            href="/auth/sign-up"
                            className="flex items-center gap-4 bg-foreground text-background px-12 py-6 rounded-[1.5rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            Subscribe to FBM Digest
                            <ArrowRight weight="bold" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container max-w-7xl mx-auto px-6 py-16 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 italic font-black text-2xl tracking-tighter text-foreground">
                            {saasMeta.name}
                        </div>
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed font-medium">
                            The curated marketing newsletter for ClickFunnels users and funnel builders.
                            Fresh strategies, tools, and community wins — 3x per week.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-bold text-xs uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                            <li><Link href="/forum" className="hover:text-primary transition-colors">Community</Link></li>
                            <li><Link href="/feedback" className="hover:text-primary transition-colors">Feedback</Link></li>
                            <li><Link href="/auth/sign-in" className="hover:text-primary transition-colors">Sign In</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="font-bold text-xs uppercase tracking-widest">In Every Digest</h4>
                        <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                            <li>Expert Tips</li>
                            <li>AI Tools</li>
                            <li>Funnel Breakdowns</li>
                            <li>Community Wins</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-xs font-bold uppercase tracking-widest border-t border-border/20 pt-10">
                    <div>
                        &copy; {new Date().getFullYear()} {saasMeta.name}. Built for funnel builders.
                    </div>
                    <div className="flex gap-10">
                        <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
