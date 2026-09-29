import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getAuthSession } from '@/lib/auth';
import { AiTripRequestSchema, validationError } from '@/lib/schemas';
import { apiSuccess, apiError } from '@/lib/api-response';
import logger from '@/lib/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback recommendations in case API fails
const fallbackRecommendations = [
  {
    name: "City Center",
    description: "Explore the heart of the city with its historic architecture and vibrant atmosphere.",
    points: 8
  },
  {
    name: "Local Museum",
    description: "Discover the rich history and culture of the destination through fascinating exhibits.",
    points: 6
  },
  {
    name: "Scenic Park",
    description: "Enjoy nature and outdoor activities in this beautiful park.",
    points: 5
  },
  {
    name: "Historic District",
    description: "Walk through streets lined with historic buildings and charming cafes.",
    points: 7
  },
  {
    name: "Local Market",
    description: "Experience local culture and cuisine at the bustling market.",
    points: 4
  }
];

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const session = await getAuthSession(request);
    const rateLimitKey = session?.userId ? `ai-rec:user:${session.userId}` : `ai-rec:ip:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        'Too many requests. Please wait a moment before asking for recommendations again.',
        'RATE_LIMIT_EXCEEDED',
        429
      );
    }

    const body = await request.json();
    const parsed = AiTripRequestSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { destination, startDate, endDate } = parsed.data;
    const cleanDestination = destination;

    if (!process.env.GEMINI_API_KEY) {
      logger.warn('Gemini API key not configured, returning fallback recommendations');
      return apiSuccess({
        recommendations: fallbackRecommendations,
        message: 'Using fallback recommendations'
      }, 200);
    }

    // Try to get recommendations from Gemini with an 8-second timeout
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

      const prompt = `Generate a list of recommended places to visit in ${cleanDestination} between ${startDate} and ${endDate}. 
      For each place, provide:
      1. Name of the place
      2. Brief description (2-3 sentences)
      3. Points (1-10) based on popularity and must-visit status
      
      Format the response as a JSON array with objects containing name, description, and points fields.
      Example format:
      [
        {
          "name": "Place Name",
          "description": "Place description",
          "points": 8
        }
      ]`;

      const generatePromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timed out')), 8000)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response text to ensure it's valid JSON
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      let recommendations;
      
      try {
        recommendations = JSON.parse(jsonStr);
      } catch (parseError) {
        logger.error({ err: parseError }, 'Error parsing Gemini response');
        throw new Error('Invalid response format from Gemini API');
      }

      // Validate the recommendations format
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('Invalid recommendations format');
      }

      // Ensure each recommendation has the required fields
      recommendations = recommendations.map(rec => ({
        name: rec.name || 'Unknown Place',
        description: rec.description || 'No description available',
        points: Math.min(Math.max(rec.points || 5, 1), 10)
      }));

      return apiSuccess({ recommendations }, 200);
    } catch (geminiError: any) {
      logger.error({ err: geminiError }, 'Gemini API error');
      
      // If Gemini API fails, return fallback recommendations
      return apiSuccess({
        recommendations: fallbackRecommendations,
        message: 'Using fallback recommendations due to API limitations'
      }, 200);
    }
  } catch (error: any) {
    logger.error({ err: error }, 'Recommendations error');
    
    // If everything fails, return fallback recommendations
    return apiSuccess({
      recommendations: fallbackRecommendations,
      message: 'Using fallback recommendations due to an error'
    }, 200);
  }
}