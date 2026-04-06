"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
    role: "USER" | "CHATBOT";
    message: string;
}

export function NexusChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "CHATBOT", message: "Greeting Researcher. I am the Nexus AI Core. How can I accelerate your squad formation or repository analysis today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "USER", message: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages
                }),
            });

            const data = await response.json();
            if (data.message) {
                setMessages(prev => [...prev, { role: "CHATBOT", message: data.message }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: "CHATBOT", message: "My synaptic links are currently fluctuating. Please try again soon." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Pulsing AI Core Button */}
            <div className="fixed bottom-8 right-8 z-[110]">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center backdrop-blur-xl group shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                                <X className="w-6 h-6 text-primary" />
                            </motion.div>
                        ) : (
                            <motion.div key="open" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <Sparkles className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pulsing ring around button */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none"
                    />
                </motion.button>
            </div>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="fixed bottom-28 right-8 w-[380px] h-[520px] max-w-[90vw] glass-premium rounded-[2.5rem] border-white/10 shadow-2xl z-[110] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black tracking-tight text-sm">NEXUS AI助理</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-70">Synaptic Core Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === "USER" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "flex gap-3",
                                        m.role === "USER" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                                        m.role === "USER" ? "bg-white/5 border-white/10" : "bg-primary/20 border-primary/40"
                                    )}>
                                        {m.role === "USER" ? <User className="w-4 h-4 text-white/60" /> : <Sparkles className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed",
                                        m.role === "USER"
                                            ? "bg-white/[0.05] border border-white/10 text-white/90 rounded-tr-none"
                                            : "bg-primary/[0.05] border border-primary/10 text-white/80 rounded-tl-none ring-1 ring-primary/10"
                                    )}>
                                        {m.message}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40">
                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    </div>
                                    <div className="p-4 bg-primary/[0.05] border border-primary/10 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map((dot) => (
                                                <motion.div
                                                    key={dot}
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: dot * 0.2 }}
                                                    className="w-1.5 h-1.5 rounded-full bg-primary/60"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 pt-0">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Enter your query..."
                                    className="w-full h-12 pl-5 pr-14 rounded-2xl glass-premium border-white/5 focus:border-primary/40 transition-all outline-none text-xs font-medium placeholder:text-white/20"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary transition-all active:scale-95 shadow-glow/10"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
