import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { useAuth } from "@/hooks/useAuth";
import { Mail } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Your private conversations
          </p>
        </div>

        {/* Inbox */}
        <div className="glass-card neon-border-cyan overflow-hidden min-h-[400px]">
          <MessagesInbox />
        </div>
      </div>
    </Layout>
  );
}
