import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ChatPopup } from "@/components/messages/ChatPopup";
import { SupportButton } from "@/components/support/SupportButton";
import { GlobalOfferNotifications } from "@/components/marketplace/GlobalOfferNotifications";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Scanner from "./pages/Scanner";
import Collections from "./pages/Collections";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Messages from "./pages/Messages";
import MyTickets from "./pages/MyTickets";
import Settings from "./pages/Settings";
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminListings from "./pages/admin/Listings";
import AdminEscalations from "./pages/admin/Escalations";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminSettings from "./pages/admin/Settings";
import SupportConsole from "./pages/SupportConsole";
import SupportInbox from "./pages/support/Inbox";
import Disputes from "./pages/support/Disputes";
import CompletedTickets from "./pages/support/CompletedTickets";
import CaseDetail from "./pages/support/CaseDetail";
import SupportReports from "./pages/support/Reports";
import SupportUsers from "./pages/support/Users";
import SavedReplies from "./pages/support/SavedReplies";
import NotAuthorized from "./pages/NotAuthorized";
import LiveStream from "./pages/LiveStream";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <BrowserRouter>
                <AuthProvider>
                    <Toaster />
                    <Sonner />
                    <ChatPopup />
                    <SupportButton />
                    <GlobalOfferNotifications />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:id" element={<Profile />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/scanner" element={<Scanner />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/my-tickets" element={<MyTickets />} />
                        <Route path="/settings" element={<Settings />} />

                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Routes>
                                        <Route path="/" element={<AdminOverview />} />
                                        <Route path="/users" element={<AdminUsers />} />
                                        <Route path="/listings" element={<AdminListings />} />
                                        <Route path="/escalations" element={<AdminEscalations />} />
                                        <Route path="/audit-logs" element={<AdminAuditLogs />} />
                                        <Route path="/settings" element={<AdminSettings />} />
                                        <Route path="*" element={<AdminOverview />} />
                                    </Routes>
                                </ProtectedRoute>
                            }
                        />

                        {/* Support Console Route */}
                        <Route
                            path="/support"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SupportConsole />
                                </ProtectedRoute>
                            }
                        />

                        {/* Support Routes */}
                        <Route
                            path="/support"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SupportConsole />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/inbox"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SupportInbox />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/disputes"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <Disputes />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/completed"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <CompletedTickets />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/case/:id"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <CaseDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/reports"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SupportReports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/users"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SupportUsers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/support/replies"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'support']}>
                                    <SavedReplies />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/not-authorized" element={<NotAuthorized />} />
                        <Route path="/live/:id" element={<LiveStream />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
