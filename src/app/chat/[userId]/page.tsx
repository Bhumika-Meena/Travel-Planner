'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/Avatar';

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  senderName: string;
}

interface User {
  _id: string;
  fullName: string;
  profilePicture?: string;
  level?: number;
}

function formatTime(timestamp: string) {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'http://localhost:3001';

export default function ChatRoom({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showScrollPill, setShowScrollPill] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isNearBottomRef = useRef(true);

  // Check if chat container is scrolled near bottom
  const checkIfNearBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return true;
    const threshold = 120;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    isNearBottomRef.current = isBottom;
    if (isBottom) {
      setShowScrollPill(false);
    }
    return isBottom;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
      setShowScrollPill(false);
    }
  }, []);

  // Fetch current user and other user info
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }

    setCurrentUser(authUser as unknown as User);

    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setOtherUser(data))
      .catch((err) => console.error('Failed to load user profile:', err));
  }, [userId, authUser, authLoading, router]);

  // Connect to socket and join room with authenticated handshake
  useEffect(() => {
    if (!currentUser) return;
    let socket: Socket | null = null;
    let isMounted = true;

    async function connectSocket() {
      let token = '';
      try {
        const tokenRes = await fetch('/api/auth/chat-token');
        if (tokenRes.ok) {
          const data = await tokenRes.json();
          token = data.token || '';
        }
      } catch (err) {
        console.warn('Could not retrieve chat auth token:', err);
      }

      if (!isMounted) return;

      socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.emit('joinRoom', { userId: currentUser!._id, otherUserId: userId });

      socket.on('chatHistory', (history: Message[]) => {
        setMessages(history || []);
        setLoadingHistory(false);
        setTimeout(() => scrollToBottom(false), 50);
      });

      socket.on('receiveMessage', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);

        // If sent by current user, always scroll down
        if (msg.senderId === currentUser?._id) {
          setTimeout(() => scrollToBottom(true), 50);
        } else {
          // If already near bottom, scroll down; otherwise show new messages pill
          if (isNearBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setShowScrollPill(true);
          }
        }
      });
    }

    connectSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUser, userId, scrollToBottom]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = newMessage.trim();
    if (!content || !currentUser || !otherUser) return;

    const msg: Message = {
      senderId: currentUser._id,
      receiverId: otherUser._id,
      content,
      timestamp: new Date().toISOString(),
      senderName: currentUser.fullName,
    };

    socketRef.current?.emit('sendMessage', msg);
    setNewMessage("");
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = !newMessage.trim();

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 bg-white sm:my-6 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-card overflow-hidden">
        {/* Chat Room Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 bg-white z-10 shadow-xs">
          <div className="flex items-center space-x-3">
            <Link
              href="/chat"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-slate-100"
              title="Back to Messages"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>

            {otherUser && (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <Link href={`/profile/${otherUser._id}`} className="hover:opacity-90 transition-opacity">
                  <Avatar
                    src={otherUser.profilePicture}
                    name={otherUser.fullName}
                    size="md"
                    className="shadow-xs"
                  />
                </Link>
                <div>
                  <Link
                    href={`/profile/${otherUser._id}`}
                    className="font-semibold text-slate-900 hover:text-primary transition-colors text-sm sm:text-base flex items-center space-x-1.5"
                  >
                    <span>{otherUser.fullName}</span>
                    {otherUser.level && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                        Lv {otherUser.level}
                      </span>
                    )}
                  </Link>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
            )}
          </div>

          {otherUser && (
            <Link
              href={`/profile/${otherUser._id}`}
              className="text-xs font-semibold text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/15 px-3.5 py-1.5 rounded-xl transition-all"
            >
              View Profile
            </Link>
          )}
        </div>

        {/* Messages Stream Container */}
        <div
          ref={chatContainerRef}
          onScroll={checkIfNearBottom}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/40 relative"
          style={{ minHeight: '380px' }}
        >
          {loadingHistory && (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Friendly Empty State */}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <Avatar
                src={otherUser?.profilePicture}
                name={otherUser?.fullName || 'Traveler'}
                size="lg"
                className="mb-3.5 shadow-card"
              />
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Say hello to {otherUser?.fullName || 'this traveler'}! 👋
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                Ask about their favorite destinations, swap travel tips, or coordinate your next trip together.
              </p>
            </div>
          )}

          {/* Messages */}
          {!loadingHistory && messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?._id;
            return (
              <div
                key={msg._id || idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end space-x-2`}
              >
                {!isMe && otherUser && (
                  <Avatar
                    src={otherUser.profilePicture}
                    name={otherUser.fullName}
                    size="sm"
                    className="mb-1 hidden sm:flex shadow-xs"
                  />
                )}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] sm:max-w-md`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl break-words text-sm shadow-xs ${
                      isMe
                        ? "bg-primary text-white rounded-br-xs shadow-primary/10"
                        : "bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium select-none">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating "New messages" pill when scrolled up */}
        {showScrollPill && (
          <div className="relative flex justify-center">
            <button
              onClick={() => scrollToBottom(true)}
              className="absolute -top-12 z-20 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg hover:bg-black transition-all animate-bounce"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>New messages</span>
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="border-t border-slate-200 p-3 sm:p-4 bg-white">
          <div className="flex items-end space-x-2 bg-slate-50 border border-slate-300 rounded-2xl p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white transition-all">
            <textarea
              rows={1}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-32"
              placeholder={`Message ${otherUser?.fullName || 'traveler'}... (Enter to send)`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              disabled={isSendDisabled}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all shrink-0 ${
                isSendDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'btn-primary shadow-xs'
              }`}
              title="Send message (Enter)"
            >
              <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 px-2 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">Shift + Enter</kbd> for new line
          </p>
        </form>
      </div>
    </div>
  );
}