"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Calendar,
    Users,
    Plus,
    CheckCircle2,
    XCircle,
    LayoutGrid,
    ShieldCheck,
    Send,
    Sparkles,
    ArrowRight,
    Zap,
    ExternalLink,
    Search,
    Clock,
    Target,
    RefreshCw,
    Wifi,
    WifiOff,
    Database,
    ChevronRight,
    Flame,
    Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──────────────────────────────────────────────────────────
interface ArenaHackathon {
    id: string;
    title: string;
    organizer: string;
    daysLeft: number | null;
    participants: number;
    imageUrl: string;
    unstopUrl: string;
    tags: string[];
    prize: string;
    teamFitScore: number;
    suggestedRoles: string[];
}

interface LocalHackathon {
    id: string;
    title: string;
    date: string;
    prize: string;
    participants: number;
    status: 'approved' | 'pending';
    category: string;
    image?: string;
}

type DataSource = "live" | "cache" | "fallback";

// ── Skeleton Card ──────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="glass-premium rounded-[2.5rem] overflow-hidden animate-pulse">
            <div className="h-52 m-2 rounded-[2rem] bg-white/[0.04]" />
            <div className="px-8 py-6 space-y-4">
                <div className="h-6 bg-white/[0.06] rounded-xl w-3/4" />
                <div className="h-4 bg-white/[0.04] rounded-lg w-1/2" />
                <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-white/[0.04] rounded-full w-16" />
                    <div className="h-6 bg-white/[0.04] rounded-full w-20" />
                </div>
                <div className="h-px bg-white/5 my-4" />
                <div className="flex justify-between items-center">
                    <div className="h-8 bg-white/[0.04] rounded-lg w-24" />
                    <div className="h-10 bg-white/[0.04] rounded-xl w-28" />
                </div>
                <div className="h-14 bg-white/[0.06] rounded-2xl w-full mt-4" />
            </div>
        </div>
    );
}

// ── Team Fit Badge ─────────────────────────────────────────────────
function TeamFitBadge({ score }: { score: number }) {
    const color =
        score >= 70
            ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-400"
            : score >= 40
                ? "from-amber-500/20 to-amber-500/5 border-amber-500/40 text-amber-400"
                : "from-red-500/20 to-red-500/5 border-red-500/40 text-red-400";

    const glowColor =
        score >= 70
            ? "rgba(16,185,129,0.3)"
            : score >= 40
                ? "rgba(245,158,11,0.3)"
                : "rgba(239,68,68,0.3)";

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${color} border text-xs font-black tracking-wider`}
            style={{ boxShadow: `0 0 12px ${glowColor}` }}
        >
            <Target className="w-3.5 h-3.5" />
            {score}% FIT
        </div>
    );
}

// ── Days Left Pill ─────────────────────────────────────────────────
function DaysLeftPill({ days }: { days: number | null }) {
    if (days === null) return <span className="text-white/20 text-xs italic">TBD</span>;

    const urgent = days <= 3;
    const soon = days <= 7;

    return (
        <span
            className={`flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider ${urgent
                    ? "text-red-400"
                    : soon
                        ? "text-amber-400"
                        : "text-white/50"
                }`}
        >
            {urgent ? <Flame className="w-3.5 h-3.5 animate-pulse" /> : <Clock className="w-3.5 h-3.5" />}
            {days === 0 ? "ENDS TODAY" : days === 1 ? "1 DAY LEFT" : `${days} DAYS LEFT`}
        </span>
    );
}

// ── Source Indicator ───────────────────────────────────────────────
function SourceIndicator({ source }: { source: DataSource }) {
    const config = {
        live: { icon: Wifi, label: "LIVE", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
        cache: { icon: Database, label: "CACHED", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
        fallback: { icon: WifiOff, label: "OFFLINE", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    };
    const { icon: Icon, label, color } = config[source];
    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-[0.2em] ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </div>
    );
}

// ── Main Page Component ────────────────────────────────────────────
export default function DashboardPage() {
    // Arena data (from API)
    const [arenaData, setArenaData] = useState<ArenaHackathon[]>([]);
    const [dataSource, setDataSource] = useState<DataSource>("fallback");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Local hackathon management (Propose + Admin)
    const [localHackathons, setLocalHackathons] = useState<LocalHackathon[]>([]);
    const [activeTab, setActiveTab] = useState("explorer");
    const [newHackathon, setNewHackathon] = useState({ title: "", date: "", prize: "", category: "", image: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch arena data
    const fetchArena = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/arena");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setArenaData(json.hackathons || []);
            setDataSource(json.source || "fallback");
        } catch (err) {
            console.error("[Arena] Fetch failed:", err);
            setError("Failed to load hackathons. Showing offline data.");
            setDataSource("fallback");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArena();
    }, []);

    // Filtered data
    const filteredHackathons = useMemo(() => {
        if (!searchQuery.trim()) return arenaData;
        const q = searchQuery.toLowerCase();
        return arenaData.filter(
            (h) =>
                h.title.toLowerCase().includes(q) ||
                h.tags.some((t) => t.toLowerCase().includes(q)) ||
                h.organizer.toLowerCase().includes(q) ||
                h.suggestedRoles.some((r) => r.toLowerCase().includes(q))
        );
    }, [arenaData, searchQuery]);

    const pendingCount = localHackathons.filter((h) => h.status === "pending").length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            const submission: LocalHackathon = {
                id: Math.random().toString(36).substr(2, 9),
                ...newHackathon,
                participants: 0,
                status: "pending",
            };
            setLocalHackathons([submission, ...localHackathons]);
            setNewHackathon({ title: "", date: "", prize: "", category: "", image: "" });
            setIsSubmitting(false);
            setActiveTab("explorer");
        }, 1500);
    };

    const handleApprove = (id: string) => {
        setLocalHackathons((prev) => prev.map((h) => (h.id === id ? { ...h, status: "approved" as const } : h)));
    };

    const handleReject = (id: string) => {
        setLocalHackathons((prev) => prev.filter((h) => h.id !== id));
    };

    return (
        <div className="pt-32 pb-20 container mx-auto px-6 max-w-7xl relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-mono tracking-widest text-primary animate-shimmer-fast overflow-hidden relative">
                        <span className="relative z-10">ARENA — REAL-TIME</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                        Nexus <span className="text-white/20 italic">Dev</span><br />
                        <span className="text-primary text-glow">Arena</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                        Live hackathon intel. Scraped, scored, and ready for your next win.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/[0.03] p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                    <TabsList className="bg-transparent gap-2 h-14">
                        <TabsTrigger value="explorer" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500">
                            <LayoutGrid className="w-5 h-5" /> Explorer
                        </TabsTrigger>
                        <TabsTrigger value="submit" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500">
                            <Plus className="w-5 h-5" /> Propose
                        </TabsTrigger>
                        <TabsTrigger value="admin" className="rounded-2xl px-8 gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 relative">
                            <ShieldCheck className="w-5 h-5" /> Admin
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-primary text-xs flex items-center justify-center rounded-full font-black shadow-lg shadow-primary">
                                    {pendingCount}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ── Tab Content ────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                >
                    {/* ── EXPLORER TAB ────────────────────────────── */}
                    {activeTab === "explorer" && (
                        <div className="space-y-10">
                            {/* WorkstackAI Promotion */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-premium p-8 rounded-[3rem] border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-primary/40 transition-all duration-700"
                            >
                                <div className="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow shrink-0">
                                        <Zap className="w-10 h-10 text-primary animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter">
                                            Ready to <span className="text-primary text-glow text-xl">Skyrocket</span> your{" "}
                                            <span className="italic text-white/20">Productivity?</span>
                                        </h2>
                                        <p className="text-white/40 max-w-xl mt-1">
                                            Create your dedicated workspace and work with better focus on{" "}
                                            <span className="text-primary font-black">WorkstackAI</span>.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://workstack-ai.vercel.app/"
                                    target="_blank"
                                    className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3 shrink-0"
                                >
                                    Create Workspace <ArrowRight className="w-5 h-5" />
                                </a>
                            </motion.div>

                            {/* Search + Controls Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                    <Input
                                        placeholder="Search hackathons, tags, roles..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-14 pl-14 pr-6 bg-white/[0.03] border-white/10 rounded-2xl text-base focus:border-primary/50 transition-all outline-none placeholder:text-white/20"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <SourceIndicator source={dataSource} />
                                    <Button
                                        onClick={fetchArena}
                                        variant="ghost"
                                        className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all active:scale-90"
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-5 h-5 text-white/50 ${isLoading ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Error State */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-premium p-6 rounded-2xl border-amber-500/20 flex items-center gap-4"
                                >
                                    <WifiOff className="w-6 h-6 text-amber-400 shrink-0" />
                                    <p className="text-amber-400/80 text-sm font-medium">{error}</p>
                                </motion.div>
                            )}

                            {/* Loading Skeletons */}
                            {isLoading && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            )}

                            {/* Hackathon Cards */}
                            {!isLoading && filteredHackathons.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                                >
                                    {filteredHackathons.map((hack, idx) => (
                                        <motion.div
                                            key={hack.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.06, type: "spring", damping: 25 }}
                                        >
                                            <Card className="glass-premium group border-white/5 hover:border-primary/50 transition-all duration-700 rounded-[2.5rem] shadow-none overflow-visible relative">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] blur-xl -z-10" />

                                                {/* Image */}
                                                <div className="relative h-52 overflow-hidden rounded-[2rem] m-2 shadow-2xl">
                                                    {hack.imageUrl ? (
                                                        <img
                                                            src={hack.imageUrl}
                                                            alt={hack.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-indigo-900/40 flex items-center justify-center">
                                                            <Trophy className="w-16 h-16 text-primary/40" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                                                    {/* Team Fit Badge — top right */}
                                                    <div className="absolute top-3 right-3">
                                                        <TeamFitBadge score={hack.teamFitScore} />
                                                    </div>

                                                    {/* Days Left — bottom left */}
                                                    <div className="absolute bottom-3 left-4">
                                                        <DaysLeftPill days={hack.daysLeft} />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <CardHeader className="space-y-3 px-8 pb-2 relative z-10">
                                                    <CardTitle className="text-xl font-black tracking-tighter text-white line-clamp-2 leading-tight">
                                                        {hack.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                                                        <Shield className="w-3 h-3 text-primary/60" />
                                                        {hack.organizer}
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="space-y-5 px-8 pb-8 pt-2">
                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {hack.tags.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className="bg-white/[0.03] border-white/10 text-[10px] text-white/50 font-mono tracking-wider hover:border-primary/30 hover:text-primary/80 transition-colors"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                                    {/* Suggested Roles */}
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">SUGGESTED ROLES</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {hack.suggestedRoles.map((role) => (
                                                                <span
                                                                    key={role}
                                                                    className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary/80 tracking-wide"
                                                                >
                                                                    {role}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Prize + Participants Row */}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                                                <Trophy className="w-4 h-4 text-emerald-400" />
                                                            </div>
                                                            <span className="text-sm font-black text-white">{hack.prize}</span>
                                                        </div>
                                                        <span className="flex items-center gap-1.5 text-xs font-mono text-white/30">
                                                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                            {hack.participants.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* CTA Button */}
                                                    <a
                                                        href={hack.unstopUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 group/btn"
                                                    >
                                                        View on Unstop
                                                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                    </a>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Empty search results */}
                            {!isLoading && filteredHackathons.length === 0 && searchQuery && (
                                <div className="h-60 flex flex-col items-center justify-center opacity-30 space-y-4">
                                    <Search className="w-12 h-12 text-white/20" />
                                    <p className="font-black uppercase tracking-widest text-sm">No hackathons match &ldquo;{searchQuery}&rdquo;</p>
                                    <Button variant="ghost" onClick={() => setSearchQuery("")} className="text-primary text-xs">
                                        Clear search
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PROPOSE TAB ─────────────────────────────── */}
                    {activeTab === "submit" && (
                        <div className="max-w-3xl mx-auto pb-20">
                            <Card className="glass-premium border-white/10 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-colors" />
                                <CardHeader className="p-0 mb-10 space-y-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse-slow">
                                        <Plus className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-4xl font-black tracking-tighter">
                                            Propose a <span className="text-primary text-glow">Hackathon</span>
                                        </CardTitle>
                                        <CardDescription className="text-lg text-white/50">Your vision, the community&apos;s next big stage.</CardDescription>
                                    </div>
                                </CardHeader>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 ml-1">Event Title</label>
                                            <Input
                                                placeholder="Nexus Dev Summit"
                                                className="h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.title}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 ml-1">Category</label>
                                            <Input
                                                placeholder="Open Source"
                                                className="h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.category}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, category: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 ml-1">Timeline</label>
                                            <Input
                                                placeholder="July 20-22"
                                                className="h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.date}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 ml-1">Prize Pool</label>
                                            <Input
                                                placeholder="$10,000"
                                                className="h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                                value={newHackathon.prize}
                                                onChange={(e) => setNewHackathon({ ...newHackathon, prize: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 ml-1">Poster Image URL</label>
                                        <Input
                                            placeholder="https://images.unsplash.com/..."
                                            className="h-16 bg-white/[0.03] border-white/10 rounded-2xl px-6 text-lg focus:border-primary/50 transition-all outline-none"
                                            value={newHackathon.image}
                                            onChange={(e) => setNewHackathon({ ...newHackathon, image: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground opacity-40 italic mt-2 ml-1 items-center flex gap-2">
                                            <Sparkles className="w-3 h-3 text-primary" /> Protip: High-resolution posters get 2x more dev signups.
                                        </p>
                                    </div>
                                    <Button
                                        disabled={isSubmitting}
                                        className="w-full h-20 bg-primary hover:bg-white hover:text-black text-xl font-black rounded-3xl gap-4 shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all duration-500 group/submit"
                                    >
                                        {isSubmitting ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                <Sparkles className="w-6 h-6" />
                                            </motion.div>
                                        ) : (
                                            <Send className="w-6 h-6 group-hover/submit:translate-x-2 group-hover/submit:-translate-y-2 transition-transform" />
                                        )}
                                        {isSubmitting ? "BROADCASTING TO NETWORK..." : "SUBMIT PROPOSAL"}
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* ── ADMIN TAB ───────────────────────────────── */}
                    {activeTab === "admin" && (
                        <div className="space-y-12 max-w-5xl mx-auto pb-20">
                            <div className="flex items-center gap-6 p-8 glass-premium rounded-[2.5rem] border-primary/20">
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-glow">
                                    <ShieldCheck className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight">
                                        Security & <span className="text-primary text-glow">Governance</span>
                                    </h2>
                                    <p className="text-white/40 font-mono text-xs uppercase tracking-widest mt-1">
                                        Reviewing {pendingCount} pending requests
                                    </p>
                                </div>
                            </div>

                            {pendingCount === 0 ? (
                                <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 space-y-6">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                    <p className="text-xl font-black uppercase tracking-widest">Protocol Synchronized</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {localHackathons
                                        .filter((h) => h.status === "pending")
                                        .map((node) => (
                                            <motion.div
                                                layout
                                                key={node.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="glass-premium p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-primary/40 transition-all duration-500"
                                            >
                                                <div className="flex items-center gap-8 w-full md:w-auto">
                                                    <div className="w-32 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                                                        {node.image ? (
                                                            <img src={node.image} alt={node.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                                <Trophy className="w-8 h-8 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-40" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-2xl font-black tracking-tight leading-none">{node.title}</h3>
                                                        <div className="flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                                                            <span className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-primary" /> {node.date}
                                                            </span>
                                                            <span className="flex items-center gap-2 font-bold text-emerald-400">
                                                                <Trophy className="w-3.5 h-3.5" /> {node.prize}
                                                            </span>
                                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] text-white/50">
                                                                {node.category}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 w-full md:w-auto">
                                                    <Button
                                                        onClick={() => handleReject(node.id)}
                                                        variant="ghost"
                                                        className="h-16 px-8 rounded-2xl hover:bg-destructive/10 hover:text-destructive gap-2 flex-1 md:flex-none border border-white/5 hover:border-destructive/20 font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                                                    >
                                                        <XCircle className="w-5 h-5" /> REJECT
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleApprove(node.id)}
                                                        className="h-16 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center justify-center gap-3 flex-1 md:flex-none shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 transition-all uppercase text-xs tracking-widest"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" /> APPROVE REQUEST
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
