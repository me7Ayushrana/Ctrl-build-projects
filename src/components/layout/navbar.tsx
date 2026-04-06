"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Terminal as GithubIcon, Users, Zap, LayoutDashboard, Sparkles, ShieldCheck, Bell, MessageSquare } from "lucide-react";
import { useSocial } from "@/components/providers/social-context";
import { NotificationPanel } from "@/components/social/notification-panel";
import { FriendsPanel } from "@/components/social/friends-panel";
import { ChatSidebar } from "@/components/social/chat-sidebar";

export function Navbar() {
    const { toggleFriendsPanel, toggleNotificationPanel, toggleChat, unreadCount, onlineFriendsCount, pendingFriendRequests } = useSocial();

    const totalFriendBadge = pendingFriendRequests.length;

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[200] flex justify-center p-6 bg-transparent pointer-events-none"
            >
                <nav className="glass px-8 py-3.5 rounded-full flex items-center justify-between w-full max-w-7xl animate-in fade-in slide-in-from-top-4 duration-1000 border-white/5 relative pointer-events-auto shadow-2xl">
                    <Link href="/" className="flex items-center gap-2 group relative z-10">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/40 group-hover:bg-primary/30 transition-all shadow-glow">
                            <Zap className="w-6 h-6 text-primary fill-primary/20" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-glow uppercase italic">DevMatch</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-7 font-semibold text-[10px] uppercase tracking-[0.15em] text-white/50 relative z-10">
                        <Link href="/matches" className="hover:text-primary transition-colors flex items-center gap-1.5 active:scale-95 transition-transform">
                            <Users className="w-3 h-3" />
                            Teammates
                        </Link>
                        <Link href="/analyzer" className="hover:text-primary transition-colors flex items-center gap-1.5 active:scale-95 transition-transform">
                            <GithubIcon className="w-3 h-3" />
                            Analyzer
                        </Link>
                        <Link href="/team" className="hover:text-primary transition-colors flex items-center gap-1.5 active:scale-95 transition-transform group/hq relative">
                            <ShieldCheck className="w-3 h-3" />
                            Nexus HQ
                            <div className="absolute -top-0.5 -right-2 w-1 h-1 bg-primary rounded-full animate-pulse shadow-glow" />
                        </Link>
                        <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1.5 active:scale-95 transition-transform">
                            <LayoutDashboard className="w-3 h-3" />
                            Arena
                        </Link>
                    </div>

                    {/* Social Action Icons — separate group */}
                    <div className="hidden md:flex items-center gap-3 relative z-10">
                        <div className="w-px h-5 bg-white/10 mx-2" />

                        {/* Friends */}
                        <button
                            onClick={toggleFriendsPanel}
                            className="relative w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 group"
                            title="Friends"
                        >
                            <Users className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                            {totalFriendBadge > 0 && (
                                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-primary text-[8px] font-black text-white rounded-full flex items-center justify-center shadow-glow">
                                    {totalFriendBadge}
                                </span>
                            )}
                            {onlineFriendsCount > 0 && totalFriendBadge === 0 && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
                            )}
                        </button>

                        {/* Notifications */}
                        <button
                            onClick={toggleNotificationPanel}
                            className="relative w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 group"
                            title="Notifications"
                        >
                            <Bell className="w-4 h-4 text-white/40 group-hover:text-amber-400 transition-colors" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Chat */}
                        <button
                            onClick={toggleChat}
                            className="relative w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all active:scale-90 group"
                            title="Messages"
                        >
                            <MessageSquare className="w-4 h-4 text-white/40 group-hover:text-cyan-400 transition-colors" />
                        </button>

                        <div className="w-px h-5 bg-white/10 mx-2" />
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                        <a
                            href="https://workstack-ai.vercel.app/"
                            target="_blank"
                            className="hidden lg:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 h-12 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary shimmer-border transition-all group/prod active:scale-95"
                        >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Boost Workflow
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
                        </a>
                        <Link href="/dashboard">
                            <Button variant="ghost" className="hover:bg-white/5 text-xs font-black uppercase tracking-widest px-6 h-10 rounded-full active:scale-95 transition-all">Sign In</Button>
                        </Link>
                        <Link href="/matches">
                            <Button className="bg-primary hover:bg-white hover:text-black text-xs font-black uppercase tracking-widest px-8 h-12 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95">
                                Build Now
                            </Button>
                        </Link>
                    </div>
                </nav>
            </motion.header>

            {/* Social Panels */}
            <NotificationPanel />
            <FriendsPanel />
            <ChatSidebar />
        </>
    );
}
