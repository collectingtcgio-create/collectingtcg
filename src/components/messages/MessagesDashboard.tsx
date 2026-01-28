import { useState } from "react";
import { Conversation } from "@/hooks/useMessages";
import { ContactsList } from "./ContactsList";
import { EnhancedMessageThread } from "./EnhancedMessageThread";
import { TraderProfileSidebar } from "./TraderProfileSidebar";
import { CreateTradeModal } from "./CreateTradeModal";
import { MessageSquare, Users, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessagesDashboard() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Mobile view states
  const [mobileView, setMobileView] = useState<'contacts' | 'chat' | 'profile'>('contacts');

  const handleSelectContact = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMobileView('chat');
  };

  const handleBackToContacts = () => {
    setSelectedConversation(null);
    setMobileView('contacts');
  };

  const handleShowProfile = () => {
    setMobileView('profile');
    setShowProfile(true);
  };

  const handleBackToChat = () => {
    setMobileView('chat');
    setShowProfile(false);
  };

  return (
    <>
      {/* Desktop Layout - 3 Panes */}
      <div className="hidden lg:flex h-[calc(100vh-200px)] min-h-[500px] gap-4">
        {/* Pane 1: Contacts List */}
        <div className="w-72 flex-shrink-0 glass-card neon-border-cyan overflow-hidden">
          <div className="p-3 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Contacts
            </h2>
          </div>
          <ContactsList
            onSelectContact={setSelectedConversation}
            selectedPartnerId={selectedConversation?.partnerId}
          />
        </div>

        {/* Pane 2: Chat Window */}
        <div className="flex-1 glass-card neon-border-cyan overflow-hidden">
          {selectedConversation ? (
            <EnhancedMessageThread
              partnerId={selectedConversation.partnerId}
              partnerUsername={selectedConversation.partnerUsername}
              partnerAvatar={selectedConversation.partnerAvatar}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Choose a contact from the list to start chatting, or visit a profile to send a new message.
              </p>
            </div>
          )}
        </div>

        {/* Pane 3: Trader Profile Sidebar */}
        <div className="w-72 flex-shrink-0 glass-card neon-border-magenta overflow-hidden">
          {selectedConversation ? (
            <TraderProfileSidebar
              partnerId={selectedConversation.partnerId}
              partnerUsername={selectedConversation.partnerUsername}
              partnerAvatar={selectedConversation.partnerAvatar}
              onCreateTrade={() => setTradeModalOpen(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Users className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a contact to view their trader profile
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Layout - Single Pane with Navigation */}
      <div className="lg:hidden">
        <div className="glass-card neon-border-cyan overflow-hidden min-h-[500px]">
          {/* Mobile Contacts View */}
          {mobileView === 'contacts' && (
            <div className="h-full">
              <div className="p-3 border-b border-border/50">
                <h2 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Contacts
                </h2>
              </div>
              <ContactsList onSelectContact={handleSelectContact} />
            </div>
          )}

          {/* Mobile Chat View */}
          {mobileView === 'chat' && selectedConversation && (
            <div className="h-full flex flex-col">
              {/* Mobile header with back and profile buttons */}
              <div className="flex items-center gap-2 p-3 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToContacts}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                    {selectedConversation.partnerAvatar ? (
                      <img
                        src={selectedConversation.partnerAvatar}
                        alt={selectedConversation.partnerUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                        {selectedConversation.partnerUsername[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold truncate">
                    {selectedConversation.partnerUsername}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShowProfile}
                  className="flex-shrink-0 text-secondary"
                >
                  <User className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Chat content without header (we have our own) */}
              <div className="flex-1 overflow-hidden">
                <EnhancedMessageThread
                  partnerId={selectedConversation.partnerId}
                  partnerUsername={selectedConversation.partnerUsername}
                  partnerAvatar={selectedConversation.partnerAvatar}
                />
              </div>
            </div>
          )}

          {/* Mobile Profile View */}
          {mobileView === 'profile' && selectedConversation && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 p-3 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToChat}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="font-semibold">Trader Profile</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <TraderProfileSidebar
                  partnerId={selectedConversation.partnerId}
                  partnerUsername={selectedConversation.partnerUsername}
                  partnerAvatar={selectedConversation.partnerAvatar}
                  onCreateTrade={() => setTradeModalOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Trade Modal */}
      {selectedConversation && (
        <CreateTradeModal
          open={tradeModalOpen}
          onOpenChange={setTradeModalOpen}
          recipientId={selectedConversation.partnerId}
          recipientUsername={selectedConversation.partnerUsername}
        />
      )}
    </>
  );
}
