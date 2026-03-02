import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation } from "@shared/schema";
import { useEffect } from "react";
import { MessageCircle, User as UserIcon } from "lucide-react";

export default function ChatList() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: conversations, isLoading } = useQuery<(Conversation & {
    product?: { title: string; images?: string[] };
    otherUser?: { name: string };
    lastMessage?: { text: string; createdAt: string };
  })[]>({
    queryKey: ["/api/chat"],
    enabled: !!user,
    refetchInterval: 5000,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-chat-heading">Messages</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
            ))}
          </div>
        ) : conversations?.length ? (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/chat/${conv.id}`}>
                <div
                  className="flex items-center gap-4 p-4 border rounded-md hover-elevate cursor-pointer"
                  data-testid={`card-conversation-${conv.id}`}
                >
                  <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0">
                    {conv.product?.images?.[0] ? (
                      <img src={conv.product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{conv.otherUser?.name || "User"}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.product?.title}</p>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage.text}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
