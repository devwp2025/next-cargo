import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import Header from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation } from "@shared/schema";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ArrowLeft } from "lucide-react";

export default function ChatConversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchedRef = useRef<string>("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading]);

  const { data: conversation } = useQuery<Conversation & {
    product?: { id: number; title: string; images?: string[]; price: number };
    otherUser?: { name: string };
  }>({
    queryKey: ["/api/chat", conversationId, "info"],
    enabled: !!user,
  });

  const { data: initialMessages } = useQuery<Message[]>({
    queryKey: ["/api/chat", conversationId, "messages"],
    enabled: !!user,
  });

  useEffect(() => {
    if (initialMessages) {
      setAllMessages(initialMessages);
      if (initialMessages.length > 0) {
        lastFetchedRef.current = initialMessages[initialMessages.length - 1].createdAt as unknown as string;
      }
    }
  }, [initialMessages]);

  const pollMessages = useCallback(async () => {
    if (!user || !conversationId) return;
    try {
      const after = lastFetchedRef.current || "";
      const res = await fetch(`/api/chat/${conversationId}/messages?after=${encodeURIComponent(after)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const newMessages: Message[] = await res.json();
        if (newMessages.length > 0) {
          setAllMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const unique = newMessages.filter(m => !existingIds.has(m.id));
            return [...prev, ...unique];
          });
          lastFetchedRef.current = newMessages[newMessages.length - 1].createdAt as unknown as string;
        }
      }
    } catch {}
  }, [user, conversationId]);

  useEffect(() => {
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [pollMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const sendMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", `/api/chat/${conversationId}/messages`, { text: messageText });
      return res.json();
    },
    onSuccess: (msg: Message) => {
      setAllMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      lastFetchedRef.current = msg.createdAt as unknown as string;
      setText("");
    },
    onError: (err: Error) => {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendMutation.mutate(text.trim());
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        <div className="flex items-center gap-3 p-4 border-b">
          <Link href="/chat">
            <Button size="icon" variant="ghost" data-testid="button-back-chat">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" data-testid="text-chat-user">{conversation?.otherUser?.name || "กำลังโหลด..."}</p>
            {conversation?.product && (
              <Link href={`/product/${conversation.product.id}`}>
                <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">
                  {conversation.product.title} - ฿{conversation.product.price.toLocaleString()}
                </p>
              </Link>
            )}
          </div>
          {conversation?.product?.images?.[0] && (
            <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0">
              <img src={conversation.product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[50vh]">
          {allMessages.map((msg) => {
            const isMine = msg.senderId === user.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-md text-sm ${
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <Input
            data-testid="input-chat-message"
            placeholder="พิมพ์ข้อความ..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={!text.trim() || sendMutation.isPending} data-testid="button-send-message">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
