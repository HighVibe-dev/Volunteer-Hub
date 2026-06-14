import { useState, useEffect, useRef } from "react";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetLeaderboard, getGetLeaderboardQueryKey,
  useListEvents, getListEventsQueryKey,
  useListApplications, getListApplicationsQueryKey,
  useListCertificates, getListCertificatesQueryKey,
  useGetMyProfile, getGetMyProfileQueryKey,
  ListEventsStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, Award, ClipboardList, Trophy, CalendarDays, MapPin,
  Users, Flame, Lock, CheckCircle2, BookOpen, Heart, Star,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

/* ─── helpers ─── */

const QUOTES = [
  "Every small act of kindness creates a ripple of change.",
  "The best way to find yourself is to lose yourself in the service of others.",
  "Together we can make a difference.",
  "Volunteers don't necessarily have the time; they have the heart.",
  "No act of kindness, no matter how small, is ever wasted.",
];

type LevelInfo = { emoji: string; name: string; min: number; max: number | null };
function getLevel(hours: number): LevelInfo {
  if (hours >= 100) return { emoji: "🏆", name: "Community Champion", min: 100, max: null };
  if (hours >= 50)  return { emoji: "🌳", name: "Impact Leader",       min: 50,  max: 100 };
  if (hours >= 10)  return { emoji: "🌿", name: "Community Helper",    min: 10,  max: 50  };
  return                    { emoji: "🌱", name: "Beginner Volunteer",  min: 0,   max: 10  };
}

function useCountUp(target: number, duration = 1100) {
  const [count, setCount] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (target === 0) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      setCount(Math.round(p * target));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return count;
}

const fadeUp   = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger  = { show: { transition: { staggerChildren: 0.08 } } };

/* ─── Hero banner ─── */

function HeroBanner({ firstName, hours, quoteIdx }: { firstName: string; hours: number; quoteIdx: number }) {
  const level = getLevel(hours);
  const pct = level.max
    ? Math.round(((hours - level.min) / (level.max - level.min)) * 100)
    : 100;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ backgroundImage: "url('/opengraph.jpg')", backgroundSize: "cover", backgroundPosition: "center 30%", minHeight: 220 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/55 to-black/15" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 p-6 min-h-[220px]">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome back, {firstName} 👋</h1>
          <p className="text-white/75 text-sm mb-4">Together we are creating positive change in communities.</p>
          <div className="inline-flex flex-col bg-white/12 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 gap-2 min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{level.emoji}</span>
              <div>
                <div className="text-white font-semibold text-sm">{level.name}</div>
                <div className="text-white/65 text-xs">
                  {level.max ? `${hours} / ${level.max} Hours` : `${hours} Hours — Max Level`}
                </div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-[#EE7F31] to-orange-300"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              />
            </div>
          </div>
        </div>
        <div className="hidden md:block max-w-[280px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={quoteIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="text-white/80 text-sm italic border-l-2 border-[#EE7F31] pl-3 leading-relaxed"
            >
              "{QUOTES[quoteIdx]}"
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated stat card ─── */

function StatCard({ label, value, icon: Icon, bg }: { label: string; value: number; icon: any; bg: string }) {
  const count = useCountUp(value);
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.18 } }}>
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="pt-5 pb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="text-3xl font-bold tabular-nums">{count}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── NGO impact strip ─── */

function ImpactStrip() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {([
        { icon: Users,    val: "500+",    label: "Volunteers" },
        { icon: Calendar, val: "120+",    label: "Events Conducted" },
        { icon: Clock,    val: "10,000+", label: "Volunteer Hours" },
        { icon: Heart,    val: "15+",     label: "Communities Reached" },
      ] as const).map((it) => (
        <div key={it.label} className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
          <it.icon className="h-5 w-5 text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">{it.val}</div>
            <div className="text-xs text-muted-foreground">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Volunteer journey ─── */

function VolunteerJourney({ profile, certCount }: { profile: any; certCount: number }) {
  const hours  = profile?.totalHours ?? 0;
  const events = profile?.eventsParticipated ?? profile?.eventsAttended ?? 0;
  const joined = !!(profile?.joinedAt ?? profile?.createdAt);

  const milestones = [
    { label: "Account Created",       sub: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "", done: joined },
    { label: "First Event Joined",    sub: "", done: events >= 1 },
    { label: "First Event Completed", sub: "", done: events >= 1 },
    { label: "10 Volunteer Hours",    sub: "", done: hours >= 10 },
    { label: "First Certificate",     sub: "", done: certCount >= 1 },
    { label: "Community Champion",    sub: "", done: hours >= 100 },
  ];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Your Volunteer Journey</CardTitle>
        <Link href="/certificates"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col md:flex-row gap-4 md:gap-0 md:items-start justify-between">
          {milestones.map((m, i) => (
            <div key={i} className="flex md:flex-col items-center flex-1 relative">
              {i < milestones.length - 1 && (
                <div
                  className={`hidden md:block absolute top-5 h-0.5 z-0 ${m.done ? "bg-primary/50" : "bg-muted"}`}
                  style={{ left: "calc(50% + 14px)", right: "calc(-50% + 14px)" }}
                />
              )}
              <motion.div
                animate={m.done ? { boxShadow: ["0 0 0px #EE7F31", "0 0 10px #EE7F3188", "0 0 0px #EE7F31"] } : {}}
                transition={{ repeat: Infinity, duration: 2.8, delay: i * 0.25 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${
                  m.done
                    ? "bg-primary border-primary text-white"
                    : "bg-muted border-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {m.done ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </motion.div>
              <div className="ml-3 md:ml-0 md:mt-2 md:text-center">
                <div className="text-xs font-medium leading-tight">{m.label}</div>
                {m.sub && <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Achievement badges ─── */

function AchievementBadges({ hours, events, certCount, rank }: { hours: number; events: number; certCount: number; rank: number | null }) {
  const badges = [
    { emoji: "🏅", label: "First Event",      unlocked: events >= 1 },
    { emoji: "⏱",  label: "10 Hours",          unlocked: hours >= 10 },
    { emoji: "🏆", label: "50 Hours",           unlocked: hours >= 50 },
    { emoji: "📜", label: "First Certificate", unlocked: certCount >= 1 },
    { emoji: "⭐", label: "Top 10 Volunteer",  unlocked: rank !== null && rank <= 10 },
    { emoji: "🔥", label: "5 Event Streak",    unlocked: events >= 5 },
  ];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Your Achievements</CardTitle>
        <span className="text-xs text-muted-foreground">{badges.filter((b) => b.unlocked).length}/{badges.length} earned</span>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {badges.map((b) => (
            <motion.div
              key={b.label}
              whileHover={{ scale: 1.07 }}
              className={`flex flex-col items-center gap-1.5 min-w-[76px] p-3 rounded-xl border-2 transition-all shrink-0 ${
                b.unlocked
                  ? "border-[#EE7F31] bg-orange-50 dark:bg-orange-950/20 shadow-md"
                  : "border-muted bg-muted/30 opacity-45"
              }`}
            >
              <span className="text-2xl">{b.unlocked ? b.emoji : "🔒"}</span>
              <span className="text-[10px] font-medium text-center leading-tight">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Monthly challenge ─── */

function MonthlyChallenge({ events }: { events: number }) {
  const goal = 2;
  const progress = Math.min(events, goal);
  const pct = Math.round((progress / goal) * 100);

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Monthly Challenge</span>
        </div>
        {events === 0 ? (
          <p className="text-sm text-muted-foreground">Join your first event this month to start your challenge! 🚀</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">Attend {goal} events this month</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-muted rounded-full h-3">
                <motion.div
                  className="h-3 rounded-full bg-gradient-to-r from-primary to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">{progress}/{goal}</span>
            </div>
            {progress >= goal && (
              <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Challenge complete! 🎉
              </div>
            )}
          </>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          Reward: <span className="font-medium text-primary">🏅 Active Volunteer Badge</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── NGO story widget ─── */

function NGOStoryWidget() {
  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/10">
      <CardContent className="pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-5 w-5 text-teal-600" />
          <span className="font-semibold text-sm">This Month's Impact</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Thanks to our volunteers:</p>
        <div className="space-y-2">
          {[
            { emoji: "🍱", text: "120 food kits distributed" },
            { emoji: "📚", text: "80 children supported" },
            { emoji: "🏠", text: "35 families assisted" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm">
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-primary font-medium mt-3">Your contribution helps make this possible ❤️</p>
      </CardContent>
    </Card>
  );
}

/* ─── Event card ─── */

function EventCard({ event }: { event: any }) {
  const GRADIENTS = [
    "from-violet-500 to-indigo-500",
    "from-teal-500 to-cyan-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
  ];
  const gradient = GRADIENTS[(event.id ?? 0) % GRADIENTS.length];
  const spots = (event.maxParticipants ?? 0) - (event.currentParticipants ?? 0);

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 10px 32px rgba(0,0,0,0.12)" }}
      className="rounded-xl border overflow-hidden bg-card"
    >
      <div className={`h-14 bg-gradient-to-r ${gradient} flex items-center px-4 gap-2`}>
        <Calendar className="h-4 w-4 text-white/80 shrink-0" />
        <span className="text-white font-medium text-sm truncate">{event.title}</span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {spots > 0 && (
          <span className="inline-block text-[10px] bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            {spots} spots left
          </span>
        )}
        <Link href={`/events/${event.id}`}>
          <Button size="sm" className="w-full mt-1 text-xs h-8 bg-primary hover:bg-primary/90">
            Join Event
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Leaderboard widget ─── */

function LeaderboardWidget({ leaderboard, userId }: { leaderboard: any[]; userId: any }) {
  const MEDALS = ["🥇", "🥈", "🥉"];
  const top5   = leaderboard.slice(0, 5);
  const myRank = leaderboard.findIndex((e) => e.volunteerId === userId);
  const me     = myRank >= 0 ? leaderboard[myRank] : null;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Top Volunteers
        </CardTitle>
        <Link href="/leaderboard">
          <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {top5.map((entry, i) => {
            const isMe = entry.volunteerId === userId;
            return (
              <div
                key={entry.volunteerId}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
                  isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"
                }`}
              >
                <span className="text-base w-6 text-center shrink-0">{MEDALS[i] ?? `#${i + 1}`}</span>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {(entry.firstName ?? "?")[0]}{(entry.lastName ?? "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {entry.firstName} {entry.lastName}{isMe ? " (You)" : ""}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary shrink-0">{entry.totalHoursLogged}h</span>
              </div>
            );
          })}

          {me && myRank >= 5 && (
            <>
              <div className="text-center text-xs text-muted-foreground py-1">···</div>
              <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold w-6 text-center text-primary shrink-0">#{myRank + 1}</span>
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {(me.firstName ?? "?")[0]}{(me.lastName ?? "?")[0]}
                </div>
                <div className="flex-1 text-sm font-medium">You</div>
                <span className="text-xs font-bold text-primary shrink-0">{me.totalHoursLogged}h</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */

export default function VolunteerDashboard() {
  const { user }                  = useAuth();
  const [quoteIdx, setQuoteIdx]   = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx((q) => (q + 1) % QUOTES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const { data: _stats, isLoading } = useGetDashboardStats({
    query: { enabled: !!user, queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: profile } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });

  const { data: myApplications } = useListApplications(
    { size: 5 },
    { query: { enabled: !!user, queryKey: getListApplicationsQueryKey({ size: 5 }) } }
  );

  const { data: certificates } = useListCertificates(
    { size: 5 },
    { query: { enabled: !!user, queryKey: getListCertificatesQueryKey({ size: 5 }) } }
  );

  const { data: upcomingEvents } = useListEvents(
    { status: ListEventsStatus.UPCOMING, size: 4 },
    { query: { enabled: !!user, queryKey: getListEventsQueryKey({ status: ListEventsStatus.UPCOMING, size: 4 }) } }
  );

  const { data: leaderboard } = useGetLeaderboard(
    { limit: 20, period: "all-time" },
    { query: { enabled: !!user, queryKey: getGetLeaderboardQueryKey({ limit: 20, period: "all-time" }) } }
  );

  const hours     = profile?.totalHours ?? 0;
  const events    = profile?.eventsParticipated ?? profile?.eventsAttended ?? 0;
  const certCount = profile?.certificatesEarned ?? certificates?.totalElements ?? 0;
  const myRank    = leaderboard ? leaderboard.findIndex((e) => e.volunteerId === user?.userId) : -1;
  const rankNum   = myRank >= 0 ? myRank + 1 : 0;
  const firstName = profile?.name?.split(" ")[0] ?? user?.firstName ?? "Volunteer";

  const appStatusColors: Record<string, string> = {
    PENDING:   "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    APPROVED:  "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300",
    REJECTED:  "bg-red-100  text-red-700   dark:bg-red-950/30   dark:text-red-300",
    WITHDRAWN: "bg-gray-100 text-gray-600  dark:bg-gray-800      dark:text-gray-400",
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-[220px] w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={stagger}>

      {/* Hero */}
      <motion.div variants={fadeUp}>
        <HeroBanner firstName={firstName} hours={hours} quoteIdx={quoteIdx} />
      </motion.div>

      {/* Quick action bar */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { href: "/events",       icon: Calendar,      label: "Browse Events" },
            { href: "/applications", icon: ClipboardList, label: "My Applications" },
            { href: "/certificates", icon: BookOpen,      label: "Certificates" },
            { href: "/leaderboard",  icon: Trophy,        label: "Leaderboard" },
          ] as const).map((a) => (
            <Link key={a.href} href={a.href}>
              <motion.div
                whileHover={{ y: -3 }}
                className="flex items-center gap-3 bg-card border rounded-xl px-4 py-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <a.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Animated stat cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Hours Volunteered"  value={hours}     icon={Clock}    bg="bg-orange-500" />
        <StatCard label="Events Attended"    value={events}    icon={Calendar} bg="bg-teal-500"   />
        <StatCard label="Certificates"       value={certCount} icon={Award}    bg="bg-violet-500" />
        <StatCard label="Leaderboard Rank"   value={rankNum}   icon={Trophy}   bg="bg-amber-500"  />
      </motion.div>

      {/* Community impact strip */}
      <motion.div variants={fadeUp}>
        <ImpactStrip />
      </motion.div>

      {/* Journey + Upcoming events */}
      <motion.div variants={fadeUp} className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VolunteerJourney profile={profile} certCount={certCount} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recommended Opportunities</h3>
            <Link href="/events"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </div>
          {upcomingEvents?.content && upcomingEvents.content.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.content.slice(0, 2).map((ev) => <EventCard key={ev.id} event={ev} />)}
            </div>
          ) : (
            <Card className="border-0 shadow-md flex-1">
              <CardContent className="py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No upcoming opportunities right now.</p>
                <p className="text-xs text-muted-foreground mb-3">Start your volunteer journey today.</p>
                <Link href="/events"><Button size="sm" variant="outline">Browse Events</Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Applications + Leaderboard */}
      <motion.div variants={fadeUp} className="grid gap-5 lg:grid-cols-2">
        {/* My Applications */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">My Applications</CardTitle>
            <Link href="/applications"><span className="text-xs text-primary hover:underline cursor-pointer">View all</span></Link>
          </CardHeader>
          <CardContent>
            {myApplications?.content && myApplications.content.length > 0 ? (
              <div className="space-y-2">
                {myApplications.content.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    data-testid={`vol-dashboard-app-${app.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{app.eventTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-3 shrink-0 ${appStatusColors[app.status] ?? ""}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No applications yet.</p>
                <p className="text-xs text-muted-foreground mb-3">Explore opportunities and make your first impact.</p>
                <Link href="/events"><Button size="sm" variant="outline">Browse Events</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 ? (
          <LeaderboardWidget leaderboard={leaderboard} userId={user?.userId} />
        ) : (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Top Volunteers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Leaderboard will appear as volunteers earn hours.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Achievement badges */}
      <motion.div variants={fadeUp}>
        <AchievementBadges hours={hours} events={events} certCount={certCount} rank={rankNum > 0 ? rankNum : null} />
      </motion.div>

      {/* Monthly challenge + NGO story */}
      <motion.div variants={fadeUp} className="grid gap-5 md:grid-cols-2">
        <MonthlyChallenge events={events} />
        <NGOStoryWidget />
      </motion.div>

      {/* Streak / motivation strip */}
      {certCount > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 rounded-xl px-5 py-4 border border-orange-200/50">
            <Flame className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="font-semibold text-sm text-primary">
                {certCount} Certificate{certCount !== 1 ? "s" : ""} Earned
              </div>
              <div className="text-xs text-muted-foreground">Keep it up! You're doing amazing.</div>
            </div>
            <div className="ml-auto flex gap-1">
              {Array.from({ length: Math.min(certCount, 5) }).map((_, i) => (
                <span key={i} className="text-lg">🔥</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
