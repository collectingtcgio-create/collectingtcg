import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MessagesDashboard } from "@/components/messages/MessagesDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Loader2 } from "lucide-react";

export default function Messages() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Chat, trade, and connect with collectors
          </p>
        </div>

        {/* 3-Pane Dashboard */}
        <MessagesDashboard />
      </div>
    </Layout>
  );
}
