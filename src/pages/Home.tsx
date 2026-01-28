import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Radio, UserPlus, CreditCard, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarketTicker } from "@/components/home/MarketTicker";
import { EventsCalendarCompact } from "@/components/events/EventsCalendarCompact";
interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
    is_live: boolean;
  };
}

interface LiveUser {
  id: string;
  username: string;
  avatar_url: string;
}

export default function Home() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const activityChannel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        () => fetchData()
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("profiles-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => fetchLiveUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchActivities(), fetchLiveUsers()]);
    setLoading(false);
  };

  const fetchActivities = async () => {
    const { data } = await supabase
      .from("activity_feed")
      .select("*, profiles(username, avatar_url, is_live)")
      .order("created_at", { ascending: false })
      .limit(8);

    if (data) {
      setActivities(data as unknown as ActivityItem[]);
    }
  };

  const fetchLiveUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("is_live", true)
      .limit(10);

    if (data) {
      setLiveUsers(data);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "scan":
        return <CreditCard className="w-4 h-4 text-primary" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-secondary" />;
      case "live":
        return <Radio className="w-4 h-4 text-secondary" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Layout>
      {/* Market Ticker - Holy Grails */}
      <MarketTicker />

      <div className="container mx-auto px-4">
        {/* Welcome Banner */}
        {!user && (
          <div className="glass-card p-8 mb-8 text-center neon-border-cyan fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Welcome to CollectingTCG
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              The ultimate social platform for trading card game collectors. Scan cards, build your collection, and connect with fellow collectors.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:neon-glow-cyan transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Live Now Section - Compact */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4 neon-border-magenta">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-secondary animate-pulse" />
                Live Now
              </h2>

              {liveUsers.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No one is live right now.
                </p>
              ) : (
                <div className="space-y-2">
                  {liveUsers.slice(0, 5).map((liveUser) => (
                    <Link
                      key={liveUser.id}
                      to={`/profile/${liveUser.id}`}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden live-border">
                        {liveUser.avatar_url ? (
                          <img
                            src={liveUser.avatar_url}
                            alt={liveUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {liveUser.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-xs">{liveUser.username}</p>
                        <p className="text-[10px] text-secondary flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                          Live
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed - Compact */}
          <div className="lg:col-span-2">
            <div className="glass-card p-4 neon-border-cyan">
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Global Activity
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">
                    No activity yet. Start scanning cards!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 6).map((activity, index) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {activity.profiles?.avatar_url ? (
                          <img
                            src={activity.profiles.avatar_url}
                            alt={activity.profiles.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium">
                            {activity.profiles?.username?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getActivityIcon(activity.activity_type)}
                          <span className="font-medium text-xs truncate">
                            {activity.profiles?.username || "Unknown"}
                          </span>
                          {activity.profiles?.is_live && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-secondary/20 text-secondary rounded-full">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        }).replace(' ago', '').replace('about ', '')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TCG Global Events - Compact */}
          <div className="lg:col-span-1">
            <EventsCalendarCompact />
          </div>
        </div>
      </div>
    </Layout>
  );
}
