"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal as GithubIcon, Send, Zap, Activity, Sparkles, Brain, UserPlus, Check, Users } from "lucide-react";
import { MatchResult } from "@/lib/utils/matching";
import { useSocial } from "@/components/providers/social-context";
import Tilt from "react-parallax-tilt";

export function MatchCard({ match }: { match: MatchResult }) {
    const [count, setCount] = useState(0);
    const [friendSent, setFriendSent] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

    const { sendFriendRequest, sendTeamInvite, isFriend, hasPendingRequest } = useSocial();

    const userAsSocial = {
        id: `user-match-${match.user.github}`,
        name: match.user.name,
        github: match.user.github,
        role: match.user.role,
        skills: match.user.skills,
        style: match.user.style,
        avatar: match.user.name[0],
        isOnline: Math.random() > 0.4, // random online status for demo
    };

    const alreadyFriend = isFriend(userAsSocial.id);
    const pendingReq = hasPendingRequest(userAsSocial.id);

    useEffect(() => {
        const controls = animate(0, match.score, {
            duration: 2,
            onUpdate: (value) => setCount(Math.round(value)),
            ease: "easeOut"
        });
        return () => controls.stop();
    }, [match.score]);

    const data = [
        { subject: "Technical", A: match.radar.technical },
        { subject: "Complement", A: match.radar.complementary },
        { subject: "Experience", A: match.radar.experience },
        { subject: "Style", A: match.radar.style },
        { subject: "Velocity", A: match.radar.velocity }
    ];

    const styleColors = {
        "Builder": "bg-blue-500/20 text-blue-400 border-blue-500/30",
        "Designer": "bg-pink-500/20 text-pink-400 border-pink-500/30",
        "Thinker": "bg-purple-500/20 text-purple-400 border-purple-500/30",
        "Hustler": "bg-orange-500/20 text-orange-400 border-orange-500/30"
    };

    const handleAddFriend = () => {
        sendFriendRequest(userAsSocial);
        setFriendSent(true);
    };

    const handleInviteTeam = () => {
        sendTeamInvite(userAsSocial);
        setInviteSent(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full"
        >
            <Tilt
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                perspective={1000}
                scale={1.02}
                transitionSpeed={1500}
                gyroscope={true}
                className="h-full"
            >
                <Card className="glass-card h-full flex flex-col overflow-hidden group relative border-white/5 hover:border-primary/50 transition-all duration-700">
                    <div className="absolute top-0 right-0 p-4 z-10 flex flex-col items-end gap-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.5 }}
                            className="bg-primary/20 text-primary px-4 py-2 rounded-2xl text-lg font-black border border-primary/30 flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                        >
                            <Zap className="w-5 h-5 fill-primary animate-pulse" />
                            {count}%
                        </motion.div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase tracking-widest font-black py-1">
                            {match.dna.strength} DNA
                        </Badge>
                    </div>

                    <CardHeader className="flex flex-row items-center gap-4 pt-10">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl font-bold border border-white/20 shadow-xl relative z-10">
                                {match.user.name[0]}
                            </div>
                            <div className="absolute inset-0 bg-primary/40 blur-xl animate-pulse -z-10" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-glow">{match.user.name}</CardTitle>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                                    <GithubIcon className="w-3 h-3 text-primary" />
                                    @{match.user.github}
                                </div>
                                <Badge className={`text-[9px] uppercase font-black px-2 py-0 h-4 border ${styleColors[match.user.style]}`}>
                                    {match.user.style}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-8 pt-4">
                        <div className="h-48 w-full -mx-4 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
                                    <PolarGrid stroke="#ffffff05" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} />
                                    <Radar
                                        dataKey="A"
                                        stroke="#6366f1"
                                        fill="#6366f1"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Compatibility Logic</h4>
                            </div>
                            <div className="space-y-3">
                                {match.reasons.map((r, i) => (
                                    <div key={i} className="flex gap-4 group/reason items-start bg-white/[0.02] p-3 rounded-xl border border-white/5 hover:border-primary/20 transition-all">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 group-hover/reason:scale-150 transition-transform" />
                                        <p className="text-xs text-white/60 leading-relaxed font-medium group-hover/reason:text-white transition-colors">
                                            {r}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" /> Skill Cluster
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {match.user.skills.map((s) => (
                                    <Badge key={s} variant="outline" className="bg-white/5 border-white/10 text-[10px] font-bold py-1 px-3 rounded-lg hover:border-primary/40 transition-all">
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Social Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleAddFriend}
                                disabled={friendSent || alreadyFriend || pendingReq}
                                className={`flex-1 h-14 rounded-2xl gap-2 font-black uppercase text-xs tracking-widest transition-all active:scale-95 ${friendSent || alreadyFriend
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                        : "bg-primary hover:bg-white hover:text-black shadow-2xl shadow-primary/20"
                                    }`}
                            >
                                {friendSent || alreadyFriend ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {alreadyFriend ? "Friends" : "Sent!"}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Add Friend
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleInviteTeam}
                                disabled={inviteSent}
                                variant="ghost"
                                className={`h-14 px-5 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest border transition-all active:scale-95 ${inviteSent
                                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                        : "border-white/10 hover:bg-white/10 hover:border-primary/30"
                                    }`}
                            >
                                {inviteSent ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                {inviteSent ? "Invited" : "Invite"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Tilt>
        </motion.div>
    );
}
