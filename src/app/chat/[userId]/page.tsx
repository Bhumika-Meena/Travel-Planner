"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

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
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'http://localhost:4000';

export default function ChatRoom({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch current user and other user info
  useEffect(() => {
    // Fetch current user from cookie
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      setCurrentUser(user);
    }
    // Fetch other user from API
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setOtherUser(data));
  }, [userId]);

  // Connect to socket and join room
  useEffect(() => {
    if (!currentUser) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit('joinRoom', { userId: currentUser._id, otherUserId: userId });
    socket.on('chatHistory', (history: Message[]) => {
      setMessages(history);
    });
    socket.on('receiveMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [currentUser, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Placeholder for websocket connection
  // useEffect(() => {
  //   // Connect to websocket and handle real-time messages
  // }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !otherUser) return;
    const msg: Message = {
      senderId: currentUser._id,
      receiverId: otherUser._id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      senderName: currentUser.fullName,
    };
    socketRef.current?.emit('sendMessage', msg);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 shadow bg-white rounded-lg mt-8">
        {/* Header */}
        <div className="flex items-center border-b px-4 py-3">
          <button onClick={() => router.back()} className="mr-4 text-blue-600">&larr; Back</button>
          {otherUser && (
            <>
              {otherUser.profilePicture ? (
                <Image src={otherUser.profilePicture} alt="Avatar" width={40} height={40} className="rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500">
                  {otherUser.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="ml-3 font-semibold text-lg">{otherUser.fullName}</span>
            </>
          )}
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.senderId === currentUser?._id ? "justify-end" : "justify-start"}`}
            >
              <div className="flex flex-col items-end max-w-xs">
                <div
                  className={`px-4 py-2 rounded-lg break-words text-sm shadow-sm ${
                    msg.senderId === currentUser?._id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 mt-1 self-end">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center border-t px-4 py-3">
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 