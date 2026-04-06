"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type {
    SocialUser, Friend, FriendRequest, ChatMessage, Conversation,
    Notification, TeamInvite, ActivityEvent, SocialState, NotificationType
} from "@/lib/types/social-types";

// ── Current User ───────────────────────────────────────────────────
const CURRENT_USER: SocialUser = {
    id: "user-self",
    name: "Ayush Rana",
    github: "ayushrana",
    role: "Frontend",
    skills: ["React", "Three.js", "TailwindCSS"],
    style: "Builder",
    avatar: "A",
    isOnline: true,
};

// ── Mock Social Users ──────────────────────────────────────────────
const SOCIAL_USERS: SocialUser[] = [
    { id: "user-1", name: "Alex River", github: "ariver_dev", role: "Backend", skills: ["Node.js", "Python", "PostgreSQL", "Redis"], style: "Builder", avatar: "A", isOnline: true },
    { id: "user-2", name: "Sarah Chen", github: "schen_design", role: "Designer", skills: ["Figma", "React", "TailwindCSS", "Framer Motion"], style: "Designer", avatar: "S", isOnline: false },
    { id: "user-3", name: "Marcus Thorne", github: "mthorne_lead", role: "Fullstack", skills: ["React", "Go", "Kubernetes", "AWS"], style: "Thinker", avatar: "M", isOnline: true },
    { id: "user-4", name: "Jasmine Lee", github: "jlee_hustle", role: "Product", skills: ["Strategy", "Market Analysis", "User Research", "Agile"], style: "Hustler", avatar: "J", isOnline: false },
    { id: "user-5", name: "Rahul Verma", github: "rahulv_code", role: "Backend", skills: ["Go", "Docker", "AWS", "MongoDB"], style: "Builder", avatar: "R", isOnline: true },
    { id: "user-6", name: "Priya Nair", github: "priya_ml", role: "Fullstack", skills: ["Python", "TensorFlow", "React", "FastAPI"], style: "Thinker", avatar: "P", isOnline: true },
];

// ── Seed Data ──────────────────────────────────────────────────────
const SEED_FRIENDS: Friend[] = [
    { ...SOCIAL_USERS[0], addedAt: Date.now() - 86400000 },
    { ...SOCIAL_USERS[2], addedAt: Date.now() - 172800000 },
];

const SEED_REQUESTS: FriendRequest[] = [
    { id: "req-1", from: SOCIAL_USERS[4], timestamp: Date.now() - 3600000, status: "pending" },
    { id: "req-2", from: SOCIAL_USERS[5], timestamp: Date.now() - 7200000, status: "pending" },
];

const SEED_NOTIFICATIONS: Notification[] = [
    { id: "notif-1", type: "smart_suggestion", title: "Missing Role Detected", message: "Your team has no DevOps engineer — you're 40% weaker in deployment velocity.", timestamp: Date.now() - 300000, read: false, actionUrl: "/matches" },
    { id: "notif-2", type: "match_found", title: "High Compatibility Alert", message: "You and Alex River have 92% compatibility. Consider teaming up!", timestamp: Date.now() - 600000, read: false, fromUser: SOCIAL_USERS[0], actionUrl: "/matches" },
    { id: "notif-3", type: "hackathon_alert", title: "Deadline Approaching", message: "Web3 DeFi Builder Sprint ends in 5 days. Your team is a great fit!", timestamp: Date.now() - 900000, read: false, actionUrl: "/dashboard" },
    { id: "notif-4", type: "friend_request", title: "Friend Request", message: "Rahul Verma wants to connect with you.", timestamp: Date.now() - 3600000, read: false, fromUser: SOCIAL_USERS[4] },
    { id: "notif-5", type: "smart_suggestion", title: "Skill Match", message: "This hackathon needs ML + React — Priya Nair covers both. Invite her!", timestamp: Date.now() - 5000000, read: true, fromUser: SOCIAL_USERS[5], actionUrl: "/matches" },
];

const SEED_CONVERSATIONS: Conversation[] = [
    {
        id: "conv-1", type: "direct", name: "Alex River",
        participants: [CURRENT_USER, SOCIAL_USERS[0]],
        lastActivity: Date.now() - 120000,
        messages: [
            { id: "m1", senderId: "user-1", text: "Hey! Saw your Three.js work — insane 🔥", timestamp: Date.now() - 600000 },
            { id: "m2", senderId: "user-self", text: "Thanks! Your Redis setup was clean too", timestamp: Date.now() - 540000 },
            { id: "m3", senderId: "user-1", text: "Down for the Web3 hackathon this weekend?", timestamp: Date.now() - 120000 },
        ],
    },
    {
        id: "conv-team", type: "team", name: "Team Nexus",
        participants: [CURRENT_USER, SOCIAL_USERS[0], SOCIAL_USERS[1]],
        lastActivity: Date.now() - 300000,
        messages: [
            { id: "tm1", senderId: "user-1", text: "API endpoints are ready 🚀", timestamp: Date.now() - 600000 },
            { id: "tm2", senderId: "user-self", text: "Frontend consuming them now", timestamp: Date.now() - 500000 },
            { id: "tm3", senderId: "user-2", text: "Design system v2 pushed to Figma", timestamp: Date.now() - 300000 },
        ],
    },
];

const SEED_INVITES: TeamInvite[] = [
    { id: "inv-1", from: SOCIAL_USERS[2], teamName: "Team Nexus", timestamp: Date.now() - 1800000, status: "pending" },
];

const SEED_ACTIVITY: ActivityEvent[] = [
    { id: "act-1", type: "team_join", message: "Alex River joined Team Nexus", timestamp: Date.now() - 60000, user: SOCIAL_USERS[0] },
    { id: "act-2", type: "hackathon_new", message: "New hackathon: Global AI Innovation Challenge", timestamp: Date.now() - 300000 },
    { id: "act-3", type: "match_found", message: "3 new matches found for your profile", timestamp: Date.now() - 600000 },
    { id: "act-4", type: "friend_added", message: "Sarah Chen accepted your friend request", timestamp: Date.now() - 900000, user: SOCIAL_USERS[1] },
    { id: "act-5", type: "team_formed", message: "Team Nexus is now complete (3/3 members)", timestamp: Date.now() - 1200000 },
];

// ── Context Type ───────────────────────────────────────────────────
interface SocialContextType extends SocialState {
    // Friend actions
    sendFriendRequest: (user: SocialUser) => void;
    acceptFriendRequest: (requestId: string) => void;
    rejectFriendRequest: (requestId: string) => void;
    isFriend: (userId: string) => boolean;
    hasPendingRequest: (userId: string) => boolean;
    // Chat actions
    sendMessage: (conversationId: string, text: string) => void;
    openChat: (conversationId: string) => void;
    openDirectChat: (userId: string) => void;
    closeChat: () => void;
    // Notification actions
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    dismissNotification: (id: string) => void;
    unreadCount: number;
    // Team invite actions
    sendTeamInvite: (user: SocialUser) => void;
    acceptTeamInvite: (inviteId: string) => void;
    rejectTeamInvite: (inviteId: string) => void;
    // Panel toggles
    toggleFriendsPanel: () => void;
    toggleNotificationPanel: () => void;
    toggleChat: () => void;
    closeAllPanels: () => void;
    // Activity
    addActivity: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
    // Helpers
    getUserById: (id: string) => SocialUser | undefined;
    pendingFriendRequests: FriendRequest[];
    pendingTeamInvites: TeamInvite[];
    onlineFriendsCount: number;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function useSocial() {
    const ctx = useContext(SocialContext);
    if (!ctx) throw new Error("useSocial must be used within SocialProvider");
    return ctx;
}

// ── Provider ───────────────────────────────────────────────────────
export function SocialProvider({ children }: { children: React.ReactNode }) {
    const [friends, setFriends] = useState<Friend[]>(SEED_FRIENDS);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(SEED_REQUESTS);
    const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
    const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
    const [teamInvites, setTeamInvites] = useState<TeamInvite[]>(SEED_INVITES);
    const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>(SEED_ACTIVITY);

    const [isFriendsPanelOpen, setFriendsPanelOpen] = useState(false);
    const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    const idCounter = useRef(100);
    const nextId = useCallback((prefix: string) => `${prefix}-${idCounter.current++}`, []);

    // ── Helpers ────────────────────────────────────────────────────
    const getUserById = useCallback((id: string) => {
        if (id === CURRENT_USER.id) return CURRENT_USER;
        return SOCIAL_USERS.find(u => u.id === id);
    }, []);

    const isFriend = useCallback((userId: string) => friends.some(f => f.id === userId), [friends]);
    const hasPendingRequest = useCallback((userId: string) =>
        friendRequests.some(r => r.from.id === userId && r.status === "pending"), [friendRequests]);

    const pendingFriendRequests = friendRequests.filter(r => r.status === "pending");
    const pendingTeamInvites = teamInvites.filter(i => i.status === "pending");
    const unreadCount = notifications.filter(n => !n.read).length;
    const onlineFriendsCount = friends.filter(f => f.isOnline).length;

    // ── Add Activity Helper ────────────────────────────────────────
    const addActivity = useCallback((event: Omit<ActivityEvent, "id" | "timestamp">) => {
        setActivityFeed(prev => [{ ...event, id: nextId("act"), timestamp: Date.now() }, ...prev]);
    }, [nextId]);

    const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
        setNotifications(prev => [{ ...n, id: nextId("notif"), timestamp: Date.now(), read: false }, ...prev]);
    }, [nextId]);

    // ── Friend Actions ─────────────────────────────────────────────
    const sendFriendRequest = useCallback((user: SocialUser) => {
        if (isFriend(user.id) || hasPendingRequest(user.id)) return;
        // Simulate: the request is instantly "received" as pending from us
        // For demo, auto-accept after 3 seconds
        const reqId = nextId("req");
        setFriendRequests(prev => [...prev, { id: reqId, from: user, timestamp: Date.now(), status: "pending" }]);
        addNotification({ type: "friend_request", title: "Friend Request Sent", message: `Request sent to ${user.name}`, fromUser: user });
        addActivity({ type: "invite_sent", message: `You sent a friend request to ${user.name}`, user });

        // Auto-accept simulation after 3s
        setTimeout(() => {
            setFriendRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "accepted" } : r));
            setFriends(prev => {
                if (prev.some(f => f.id === user.id)) return prev;
                return [...prev, { ...user, addedAt: Date.now() }];
            });
            addActivity({ type: "friend_added", message: `${user.name} accepted your friend request`, user });
            addNotification({ type: "friend_request", title: "Request Accepted!", message: `${user.name} is now your friend`, fromUser: user });
        }, 3000);
    }, [isFriend, hasPendingRequest, nextId, addActivity, addNotification]);

    const acceptFriendRequest = useCallback((requestId: string) => {
        const req = friendRequests.find(r => r.id === requestId);
        if (!req) return;
        setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "accepted" } : r));
        setFriends(prev => {
            if (prev.some(f => f.id === req.from.id)) return prev;
            return [...prev, { ...req.from, addedAt: Date.now() }];
        });
        addActivity({ type: "friend_added", message: `You and ${req.from.name} are now friends`, user: req.from });
    }, [friendRequests, addActivity]);

    const rejectFriendRequest = useCallback((requestId: string) => {
        setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "rejected" } : r));
    }, []);

    // ── Chat Actions ───────────────────────────────────────────────
    const sendMessage = useCallback((conversationId: string, text: string) => {
        if (!text.trim()) return;
        const msg: ChatMessage = { id: nextId("msg"), senderId: CURRENT_USER.id, text: text.trim(), timestamp: Date.now() };
        setConversations(prev => prev.map(c =>
            c.id === conversationId
                ? { ...c, messages: [...c.messages, msg], lastActivity: Date.now() }
                : c
        ));

        // Simulate reply after 2s
        setTimeout(() => {
            const conv = conversations.find(c => c.id === conversationId);
            const responder = conv?.participants.find(p => p.id !== CURRENT_USER.id);
            if (!responder) return;
            const replies = [
                "Sounds good! Let's sync up later 🤝",
                "On it! Pushing changes now 🚀",
                "Nice work! That looks clean 💎",
                "Agreed, let's ship this 🔥",
                "Great idea, I'll add that to the board",
            ];
            const reply: ChatMessage = {
                id: nextId("msg"),
                senderId: responder.id,
                text: replies[Math.floor(Math.random() * replies.length)],
                timestamp: Date.now(),
            };
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, messages: [...c.messages, reply], lastActivity: Date.now() }
                    : c
            ));
        }, 2000 + Math.random() * 1000);
    }, [conversations, nextId]);

    const openChat = useCallback((conversationId: string) => {
        setActiveChatId(conversationId);
        setChatOpen(true);
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
    }, []);

    const openDirectChat = useCallback((userId: string) => {
        let conv = conversations.find(c => c.type === "direct" && c.participants.some(p => p.id === userId));
        if (!conv) {
            const user = getUserById(userId);
            if (!user) return;
            const newConv: Conversation = {
                id: nextId("conv"),
                type: "direct",
                name: user.name,
                participants: [CURRENT_USER, user],
                messages: [],
                lastActivity: Date.now(),
            };
            setConversations(prev => [...prev, newConv]);
            conv = newConv;
        }
        openChat(conv.id);
    }, [conversations, getUserById, nextId, openChat]);

    const closeChat = useCallback(() => {
        setChatOpen(false);
        setActiveChatId(null);
    }, []);

    // ── Notification Actions ───────────────────────────────────────
    const markNotificationRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // ── Team Invite Actions ────────────────────────────────────────
    const sendTeamInvite = useCallback((user: SocialUser) => {
        if (teamInvites.some(i => i.from.id === user.id && i.status === "pending")) return;
        setTeamInvites(prev => [...prev, {
            id: nextId("inv"), from: user, teamName: "Team Nexus", timestamp: Date.now(), status: "pending"
        }]);
        addNotification({ type: "team_invite", title: "Team Invite Sent", message: `Invited ${user.name} to Team Nexus`, fromUser: user });
        addActivity({ type: "invite_sent", message: `You invited ${user.name} to Team Nexus`, user });
    }, [teamInvites, nextId, addNotification, addActivity]);

    const acceptTeamInvite = useCallback((inviteId: string) => {
        const inv = teamInvites.find(i => i.id === inviteId);
        if (!inv) return;
        setTeamInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: "accepted" } : i));
        addActivity({ type: "team_join", message: `${inv.from.name} joined ${inv.teamName}`, user: inv.from });
        addNotification({ type: "team_invite", title: "Invite Accepted!", message: `${inv.from.name} joined your team`, fromUser: inv.from });
    }, [teamInvites, addNotification, addActivity]);

    const rejectTeamInvite = useCallback((inviteId: string) => {
        setTeamInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: "rejected" } : i));
    }, []);

    // ── Panel Toggles ──────────────────────────────────────────────
    const toggleFriendsPanel = useCallback(() => {
        setFriendsPanelOpen(prev => !prev);
        setNotificationPanelOpen(false);
        setChatOpen(false);
    }, []);

    const toggleNotificationPanel = useCallback(() => {
        setNotificationPanelOpen(prev => !prev);
        setFriendsPanelOpen(false);
    }, []);

    const toggleChat = useCallback(() => {
        setChatOpen(prev => !prev);
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
    }, []);

    const closeAllPanels = useCallback(() => {
        setFriendsPanelOpen(false);
        setNotificationPanelOpen(false);
        setChatOpen(false);
        setActiveChatId(null);
    }, []);

    const value: SocialContextType = {
        currentUser: CURRENT_USER,
        friends, friendRequests, notifications, conversations, teamInvites, activityFeed,
        isFriendsPanelOpen, isNotificationPanelOpen, isChatOpen, activeChatId,
        // Friend
        sendFriendRequest, acceptFriendRequest, rejectFriendRequest, isFriend, hasPendingRequest,
        // Chat
        sendMessage, openChat, openDirectChat, closeChat,
        // Notification
        markNotificationRead, markAllNotificationsRead, dismissNotification, unreadCount,
        // Team
        sendTeamInvite, acceptTeamInvite, rejectTeamInvite,
        // Panels
        toggleFriendsPanel, toggleNotificationPanel, toggleChat, closeAllPanels,
        // Helpers
        addActivity, getUserById, pendingFriendRequests, pendingTeamInvites, onlineFriendsCount,
    };

    return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
