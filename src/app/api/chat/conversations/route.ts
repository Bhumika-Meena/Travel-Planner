import { getAuthSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.userId) {
      return apiError('User not authenticated', 'UNAUTHORIZED', 401);
    }

    const userId = session.userId;
    const { db } = await connectToDatabase();

    // Use MongoDB aggregation to group by conversation partner directly on the database engine
    // rather than loading unbounded historical messages into Node.js heap memory
    const conversationsRaw = await db
      .collection('messages')
      .aggregate<{
        _id: string;
        lastMessage: string;
        timestamp: Date | string;
        unreadCount: number;
      }>([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            content: 1,
            createdAt: 1,
            timestamp: 1,
            isRead: 1,
            receiverId: 1,
            senderId: 1,
            partnerId: {
              $cond: {
                if: { $eq: ['$senderId', userId] },
                then: '$receiverId',
                else: '$senderId'
              }
            }
          }
        },
        {
          $group: {
            _id: '$partnerId',
            lastMessage: { $first: '$content' },
            timestamp: {
              $first: {
                $ifNull: ['$timestamp', '$createdAt']
              }
            },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$receiverId', userId] },
                      { $ne: ['$isRead', true] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { timestamp: -1 }
        }
      ])
      .toArray();

    // Fetch user details for all conversation partners
    const partnerIds = conversationsRaw
      .map(c => c._id)
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const partners = partnerIds.length > 0
      ? await db
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
          .toArray()
      : [];

    const partnerInfoMap = new Map(
      partners.map(p => [p._id.toString(), p])
    );

    const conversations = conversationsRaw
      .filter(conv => conv._id)
      .map(conv => {
        const user = partnerInfoMap.get(conv._id);
        const rawTime = conv.timestamp;
        const formattedTimestamp =
          rawTime instanceof Date
            ? rawTime.toISOString()
            : (rawTime ? String(rawTime) : new Date().toISOString());

        return {
          partnerId: conv._id,
          partnerName: user?.fullName || 'Traveler',
          partnerAvatar: user?.profilePicture || null,
          partnerLevel: user?.level || 1,
          partnerPoints: user?.points || 0,
          lastMessage: conv.lastMessage || '',
          timestamp: formattedTimestamp,
          unreadCount: conv.unreadCount || 0
        };
      });

    return apiSuccess({ conversations }, 200);
  } catch (error) {
    logger.error({ err: error }, 'Error in /api/chat/conversations');
    return apiError('Failed to fetch conversations', 'INTERNAL_SERVER_ERROR', 500);
  }
}
