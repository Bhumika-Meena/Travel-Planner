import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = session.userId;
    const { db } = await connectToDatabase();

    // Find all messages where the current user is sender or receiver
    const messages = await db
      .collection('messages')
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group messages by the other participant
    const conversationMap = new Map<string, {
      partnerId: string;
      lastMessage: string;
      timestamp: string;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnerId) continue;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: msg.content || '',
          timestamp: msg.timestamp || msg.createdAt?.toISOString?.() || new Date().toISOString(),
          unreadCount: (msg.receiverId === userId && !msg.isRead) ? 1 : 0
        });
      } else {
        if (msg.receiverId === userId && !msg.isRead) {
          const conv = conversationMap.get(partnerId)!;
          conv.unreadCount += 1;
        }
      }
    }

    // Fetch user details for all conversation partners
    const partnerIds = Array.from(conversationMap.keys())
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const partners = await db
      .collection('users')
      .find(
        { _id: { $in: partnerIds } },
        {
          projection: {
            _id: 1,
            fullName: 1,
            profilePicture: 1,
            level: 1,
            points: 1
          }
        }
      )
      .toArray();

    const partnerInfoMap = new Map(
      partners.map(p => [p._id.toString(), p])
    );

    const conversations = Array.from(conversationMap.values()).map(conv => {
      const user = partnerInfoMap.get(conv.partnerId);
      return {
        partnerId: conv.partnerId,
        partnerName: user?.fullName || 'Traveler',
        partnerAvatar: user?.profilePicture || null,
        partnerLevel: user?.level || 1,
        partnerPoints: user?.points || 0,
        lastMessage: conv.lastMessage,
        timestamp: conv.timestamp,
        unreadCount: conv.unreadCount
      };
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/chat/conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
