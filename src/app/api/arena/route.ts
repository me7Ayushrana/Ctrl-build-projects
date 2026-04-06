import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// ── Types ──────────────────────────────────────────────────────────
export interface ArenaHackathon {
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

interface CacheEntry {
    data: ArenaHackathon[];
    timestamp: number;
}

// ── Cache (10-minute TTL) ──────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000;
let cache: CacheEntry | null = null;

// ── Role Mapping ───────────────────────────────────────────────────
const TAG_ROLE_MAP: Record<string, string[]> = {
    "ai": ["ML Engineer", "Data Scientist"],
    "ml": ["ML Engineer", "Data Scientist"],
    "machine learning": ["ML Engineer", "Data Scientist"],
    "deep learning": ["ML Engineer", "AI Researcher"],
    "web": ["Frontend Dev", "Full-Stack Dev"],
    "frontend": ["Frontend Dev", "UI/UX Designer"],
    "backend": ["Backend Dev", "DevOps Engineer"],
    "blockchain": ["Smart Contract Dev", "Web3 Engineer"],
    "web3": ["Web3 Engineer", "Smart Contract Dev"],
    "mobile": ["Mobile Dev", "React Native Dev"],
    "iot": ["IoT Engineer", "Embedded Dev"],
    "cloud": ["Cloud Architect", "DevOps Engineer"],
    "cybersecurity": ["Security Analyst", "Pen Tester"],
    "data": ["Data Engineer", "Data Analyst"],
    "design": ["UI/UX Designer", "Product Designer"],
    "game": ["Game Dev", "Unity Developer"],
    "ar": ["AR/VR Dev", "3D Artist"],
    "vr": ["AR/VR Dev", "3D Artist"],
    "sustainability": ["Green Tech Dev", "Full-Stack Dev"],
    "fintech": ["Backend Dev", "Full-Stack Dev"],
    "healthtech": ["Full-Stack Dev", "Data Scientist"],
    "edtech": ["Full-Stack Dev", "Frontend Dev"],
};

function deriveRoles(tags: string[]): string[] {
    const roles = new Set<string>();
    for (const tag of tags) {
        const lower = tag.toLowerCase();
        for (const [keyword, mapped] of Object.entries(TAG_ROLE_MAP)) {
            if (lower.includes(keyword)) {
                mapped.forEach((r) => roles.add(r));
            }
        }
    }
    if (roles.size === 0) roles.add("Full-Stack Dev");
    return Array.from(roles).slice(0, 3);
}

function computeTeamFitScore(tags: string[]): number {
    // Simulated score based on tag diversity + popularity heuristics
    const base = 40;
    const tagBonus = Math.min(tags.length * 8, 30);
    const jitter = Math.floor(Math.random() * 20);
    return Math.min(base + tagBonus + jitter, 98);
}

function parseDaysLeft(text: string): number | null {
    const match = text.match(/(\d+)\s*days?\s*left/i);
    if (match) return parseInt(match[1], 10);
    if (/today|ends today/i.test(text)) return 0;
    if (/tomorrow/i.test(text)) return 1;
    return null;
}

// ── Scraper ────────────────────────────────────────────────────────
async function scrapeUnstop(): Promise<ArenaHackathon[]> {
    const { data: html } = await axios.get(
        "https://unstop.com/hackathons",
        {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            timeout: 8000,
        }
    );

    const $ = cheerio.load(html);
    const hackathons: ArenaHackathon[] = [];

    // Unstop renders hackathon cards — we attempt multiple selectors for resilience
    const cardSelectors = [
        ".single_card",
        ".oppor_card",
        "[class*='hackathon']",
        ".listing-card",
        ".seprator_card",
    ];

    let $cards = $([]);
    for (const sel of cardSelectors) {
        $cards = $(sel);
        if ($cards.length > 0) break;
    }

    // If no cards found via selectors, try to parse any link-based listing
    if ($cards.length === 0) {
        $("a[href*='/hackathons/']").each((i, el) => {
            if (i >= 12) return false; // stop at 12
            const $el = $(el);
            const href = $el.attr("href") || "";
            const title = $el.text().trim() || $el.find("h3, h4, .title, [class*='title']").first().text().trim();
            if (!title || title.length < 3) return;

            const fullUrl = href.startsWith("http") ? href : `https://unstop.com${href}`;
            const imgEl = $el.find("img").first();
            const imageUrl = imgEl.attr("src") || imgEl.attr("data-src") || "";

            const cardText = $el.text().toLowerCase();
            const tags: string[] = [];
            if (/\bai\b|artificial intelligence|machine learning|ml\b/i.test(cardText)) tags.push("AI/ML");
            if (/web|frontend|backend|full.?stack/i.test(cardText)) tags.push("Web Dev");
            if (/blockchain|web3|crypto/i.test(cardText)) tags.push("Blockchain");
            if (/mobile|android|ios|flutter/i.test(cardText)) tags.push("Mobile");
            if (/data|analytics/i.test(cardText)) tags.push("Data Science");
            if (/design|ui|ux/i.test(cardText)) tags.push("Design");
            if (/cloud|aws|azure|gcp/i.test(cardText)) tags.push("Cloud");
            if (/iot|hardware|embedded/i.test(cardText)) tags.push("IoT");
            if (/game|unity|unreal/i.test(cardText)) tags.push("Game Dev");
            if (/sustainab|green|climate|environment/i.test(cardText)) tags.push("Sustainability");
            if (tags.length === 0) tags.push("Open Innovation");

            const participantMatch = cardText.match(/([\d,]+)\s*(?:participants?|teams?|registered)/i);
            const participants = participantMatch ? parseInt(participantMatch[1].replace(/,/g, ""), 10) : Math.floor(Math.random() * 800 + 200);

            const prizeMatch = cardText.match(/(?:₹|inr|usd|\$)\s?[\d,]+(?:\.\d+)?(?:\s*(?:k|lakh|lac|cr))?/i) || cardText.match(/([\d,]+)\s*(?:prize|worth|cash)/i);
            const prize = prizeMatch ? prizeMatch[0].trim() : "Prizes Available";

            hackathons.push({
                id: `unstop-${i}-${Date.now()}`,
                title: title.slice(0, 80),
                organizer: "Unstop",
                daysLeft: parseDaysLeft(cardText),
                participants,
                imageUrl,
                unstopUrl: fullUrl,
                tags,
                prize,
                teamFitScore: computeTeamFitScore(tags),
                suggestedRoles: deriveRoles(tags),
            });
        });
    } else {
        $cards.each((i, el) => {
            if (i >= 12) return false;
            const $card = $(el);
            const title = $card.find("h3, h4, .title, [class*='title'], .card-title").first().text().trim()
                || $card.find("a").first().text().trim();
            if (!title || title.length < 3) return;

            const linkEl = $card.find("a[href*='/hackathon']").first();
            const href = linkEl.attr("href") || $card.find("a").first().attr("href") || "";
            const fullUrl = href.startsWith("http") ? href : `https://unstop.com${href}`;

            const imgEl = $card.find("img").first();
            const imageUrl = imgEl.attr("src") || imgEl.attr("data-src") || "";

            const cardText = $card.text().toLowerCase();
            const tags: string[] = [];
            if (/\bai\b|artificial intelligence|machine learning|ml\b/i.test(cardText)) tags.push("AI/ML");
            if (/web|frontend|backend|full.?stack/i.test(cardText)) tags.push("Web Dev");
            if (/blockchain|web3|crypto/i.test(cardText)) tags.push("Blockchain");
            if (/mobile|android|ios|flutter/i.test(cardText)) tags.push("Mobile");
            if (/data|analytics/i.test(cardText)) tags.push("Data Science");
            if (/design|ui|ux/i.test(cardText)) tags.push("Design");
            if (/cloud|aws|azure|gcp/i.test(cardText)) tags.push("Cloud");
            if (/iot|hardware|embedded/i.test(cardText)) tags.push("IoT");
            if (/game|unity|unreal/i.test(cardText)) tags.push("Game Dev");
            if (/sustainab|green|climate|environment/i.test(cardText)) tags.push("Sustainability");
            if (tags.length === 0) tags.push("Open Innovation");

            const participantMatch = cardText.match(/([\d,]+)\s*(?:participants?|teams?|registered)/i);
            const participants = participantMatch ? parseInt(participantMatch[1].replace(/,/g, ""), 10) : Math.floor(Math.random() * 800 + 200);

            const prizeMatch = cardText.match(/(?:₹|inr|usd|\$)\s?[\d,]+(?:\.\d+)?(?:\s*(?:k|lakh|lac|cr))?/i);
            const prize = prizeMatch ? prizeMatch[0].trim() : "Prizes Available";

            hackathons.push({
                id: `unstop-${i}-${Date.now()}`,
                title: title.slice(0, 80),
                organizer: $card.find("[class*='organizer'], .org-name, .company").first().text().trim() || "Unstop",
                daysLeft: parseDaysLeft(cardText),
                participants,
                imageUrl,
                unstopUrl: fullUrl,
                tags,
                prize,
                teamFitScore: computeTeamFitScore(tags),
                suggestedRoles: deriveRoles(tags),
            });
        });
    }

    return hackathons;
}

// ── Fallback Data ──────────────────────────────────────────────────
const FALLBACK_DATA: ArenaHackathon[] = [
    {
        id: "fallback-1",
        title: "Global AI Innovation Challenge 2026",
        organizer: "Unstop × Google",
        daysLeft: 12,
        participants: 2400,
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["AI/ML", "Cloud"],
        prize: "$50,000",
        teamFitScore: 92,
        suggestedRoles: ["ML Engineer", "Data Scientist", "Cloud Architect"],
    },
    {
        id: "fallback-2",
        title: "Web3 DeFi Builder Sprint",
        organizer: "Unstop × Ethereum Foundation",
        daysLeft: 5,
        participants: 1100,
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Blockchain", "Web Dev"],
        prize: "$30,000",
        teamFitScore: 78,
        suggestedRoles: ["Smart Contract Dev", "Web3 Engineer", "Frontend Dev"],
    },
    {
        id: "fallback-3",
        title: "Sustain-a-Thon: Green Tech for Tomorrow",
        organizer: "Unstop × UN Youth",
        daysLeft: 21,
        participants: 680,
        imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Sustainability", "IoT"],
        prize: "$20,000",
        teamFitScore: 65,
        suggestedRoles: ["Green Tech Dev", "IoT Engineer", "Full-Stack Dev"],
    },
    {
        id: "fallback-4",
        title: "HealthTech Disrupt 2026",
        organizer: "Unstop × WHO Digital",
        daysLeft: 8,
        participants: 950,
        imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["AI/ML", "Data Science"],
        prize: "$25,000",
        teamFitScore: 84,
        suggestedRoles: ["Full-Stack Dev", "Data Scientist", "ML Engineer"],
    },
    {
        id: "fallback-5",
        title: "NextGen Mobile App Challenge",
        organizer: "Unstop × Apple Developer Academy",
        daysLeft: 15,
        participants: 1500,
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Mobile", "Design"],
        prize: "$40,000",
        teamFitScore: 71,
        suggestedRoles: ["Mobile Dev", "UI/UX Designer", "React Native Dev"],
    },
    {
        id: "fallback-6",
        title: "CyberShield CTF & Build",
        organizer: "Unstop × CloudFlare",
        daysLeft: 3,
        participants: 780,
        imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
        unstopUrl: "https://unstop.com/hackathons",
        tags: ["Cloud", "Web Dev"],
        prize: "$15,000",
        teamFitScore: 56,
        suggestedRoles: ["Security Analyst", "DevOps Engineer", "Backend Dev"],
    },
];

// ── Route Handler ──────────────────────────────────────────────────
export async function GET() {
    // Check cache first
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        return NextResponse.json({
            hackathons: cache.data,
            source: "cache" as const,
            count: cache.data.length,
        });
    }

    try {
        const hackathons = await scrapeUnstop();

        if (hackathons.length > 0) {
            cache = { data: hackathons, timestamp: Date.now() };
            return NextResponse.json({
                hackathons,
                source: "live" as const,
                count: hackathons.length,
            });
        }

        // Scrape returned empty → use fallback
        return NextResponse.json({
            hackathons: FALLBACK_DATA,
            source: "fallback" as const,
            count: FALLBACK_DATA.length,
        });
    } catch (error) {
        console.error("[Arena API] Scrape failed, using fallback:", error);
        return NextResponse.json({
            hackathons: FALLBACK_DATA,
            source: "fallback" as const,
            count: FALLBACK_DATA.length,
        });
    }
}
