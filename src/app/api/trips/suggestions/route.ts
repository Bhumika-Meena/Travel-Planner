import { GoogleGenAI, Type } from '@google/genai';
import { HfInference } from '@huggingface/inference';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getAuthSession } from '@/lib/auth';
import { AiTripRequestSchema, validationError } from '@/lib/schemas';
import { apiSuccess, apiError } from '@/lib/api-response';
import { calculateTaskReward } from '@/lib/gamification';
import logger from '@/lib/logger';

interface RawPlace {
  name: string;
  description: string;
}

// Default curated fallback places if both AI providers are unavailable or fail
function getFallbackPlaces(destination: string): RawPlace[] {
  return [
    {
      name: `${destination} City Center`,
      description: 'Explore the heart of the city with its main attractions, architecture, and cultural landmarks.',
    },
    {
      name: 'Local Market',
      description: 'Experience authentic local culture, artisan crafts, and street cuisine at the bustling central market.',
    },
    {
      name: 'Historical Museum',
      description: 'Discover the rich history, ancient artifacts, and heritage exhibits of the destination.',
    },
    {
      name: 'Scenic Park & Gardens',
      description: 'Relax and take in the natural beauty, walking trails, and serene landscape of the municipal park.',
    },
    {
      name: 'Traditional Restaurant District',
      description: 'Taste iconic local culinary specialties and regional cuisine at established neighborhood eateries.',
    },
    {
      name: 'Historic Temple / Cathedral',
      description: 'Visit a prominent religious or spiritual heritage site known for its architecture and history.',
    },
    {
      name: 'Art & Cultural Gallery',
      description: 'Admire works from classical and contemporary local artists celebrating national culture.',
    },
    {
      name: 'Panoramic Viewpoint',
      description: 'Enjoy sweeping skyline views and photography vantage points overlooking the city and surroundings.',
    },
    {
      name: 'Old Town Walking Street',
      description: 'Stroll cobblestone streets lined with charming cafes, boutique shops, and historical facades.',
    },
    {
      name: 'Waterfront / Riverside Promenade',
      description: 'Unwind along the scenic waterfront promenade with evening lights and lively public spaces.',
    },
  ];
}

/**
 * 1. Primary: Google Gemini with native structured JSON schema
 * Uses official @google/genai SDK with gemini-2.5-flash
 */
async function fetchGeminiSuggestions(
  destination: string,
  duration: number,
  startDate: string,
  endDate: string
): Promise<RawPlace[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('AIza_your') || apiKey.includes('xxxx')) {
    logger.debug('GEMINI_API_KEY is unset or placeholder; bypassing Gemini');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert travel assistant. Generate 7 to 10 interesting, popular places to visit in ${destination} for a ${duration}-day trip (${startDate} to ${endDate}).
For each place, provide a concise name and an engaging description (1 to 3 sentences) explaining why it is worth visiting.`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API timed out after 8s')), 8000)
  );

  const generatePromise = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Name of the landmark or attraction',
            },
            description: {
              type: Type.STRING,
              description: 'Brief description of the place and why to visit',
            },
          },
          required: ['name', 'description'],
        },
      },
    },
  });

  const response = await Promise.race([generatePromise, timeoutPromise]);
  const jsonText = response.text?.trim();
  if (!jsonText) {
    throw new Error('Gemini returned empty response text');
  }

  // Guaranteed valid JSON array matching the schema
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini returned an empty suggestions list');
  }

  const validPlaces = parsed
    .filter((p) => p && typeof p.name === 'string' && p.name.trim().length > 0)
    .map((p) => ({
      name: String(p.name).trim(),
      description: typeof p.description === 'string' ? p.description.trim() : '',
    }));

  return validPlaces.length > 0 ? validPlaces : null;
}

/**
 * 2. Fallback: Hugging Face with chatCompletion()
 */
async function fetchHuggingFaceSuggestions(
  destination: string,
  duration: number
): Promise<RawPlace[] | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey.startsWith('hf_your') || apiKey.includes('xxxx')) {
    logger.debug('HUGGINGFACE_API_KEY is unset or placeholder; bypassing Hugging Face');
    return null;
  }

  const hf = new HfInference(apiKey);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('HuggingFace API timed out after 10s')), 10000)
  );

  const chatPromise = hf.chatCompletion({
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    messages: [
      {
        role: 'system',
        content: 'You are an expert travel planner. Return strictly a JSON array of objects with "name" and "description" fields. No markdown formatting, no preambles, no explanations.',
      },
      {
        role: 'user',
        content: `Generate 7 to 10 recommended places to visit in ${destination} for a ${duration}-day trip. Format strictly as JSON: [{"name": "Landmark Name", "description": "Engaging description"}]`,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const response = await Promise.race([chatPromise, timeoutPromise]);
  const rawContent = response.choices?.[0]?.message?.content?.trim() || '';

  // Clean possible markdown code fences if present in chat response
  const cleaned = rawContent.replace(/```(?:json)?\n?|\n?```/g, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('HuggingFace chatCompletion response did not contain a valid JSON array');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('HuggingFace returned an empty suggestions list');
  }

  const validPlaces = parsed
    .filter((p) => p && typeof p.name === 'string' && p.name.trim().length > 0)
    .map((p) => ({
      name: String(p.name).trim(),
      description: typeof p.description === 'string' ? p.description.trim() : '',
    }));

  return validPlaces.length > 0 ? validPlaces : null;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const session = await getAuthSession(request);
    const rateLimitKey = session?.userId ? `ai-sug:user:${session.userId}` : `ai-sug:ip:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000);
    if (!rateLimit.success) {
      return apiError(
        'Too many requests. Please wait a minute before requesting suggestions again.',
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
    const cleanDestination = destination.trim();

    // Calculate trip duration in days (clamped between 1 and 30)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.max(1, Math.min(30, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));

    let rawPlaces: RawPlace[] | null = null;
    let providerUsed: 'gemini' | 'huggingface' | 'fallback' = 'fallback';

    // ─── Step 1: Try Gemini First (gemini-2.5-flash with structured JSON) ──
    try {
      rawPlaces = await fetchGeminiSuggestions(cleanDestination, duration, startDate, endDate);
      if (rawPlaces && rawPlaces.length > 0) {
        providerUsed = 'gemini';
        logger.info({ destination: cleanDestination, provider: 'gemini', count: rawPlaces.length }, 'Generated trip suggestions with Gemini (gemini-2.5-flash)');
      }
    } catch (geminiErr: any) {
      logger.warn({ err: geminiErr.message || geminiErr, destination: cleanDestination }, 'Gemini suggestions failed, attempting Hugging Face fallback');
    }

    // ─── Step 2: Try Hugging Face Fallback (chatCompletion) ─────────────────
    if (!rawPlaces || rawPlaces.length === 0) {
      try {
        rawPlaces = await fetchHuggingFaceSuggestions(cleanDestination, duration);
        if (rawPlaces && rawPlaces.length > 0) {
          providerUsed = 'huggingface';
          logger.info({ destination: cleanDestination, provider: 'huggingface', count: rawPlaces.length }, 'Generated trip suggestions with Hugging Face (chatCompletion)');
        }
      } catch (hfErr: any) {
        logger.warn({ err: hfErr.message || hfErr, destination: cleanDestination }, 'Hugging Face suggestions failed, falling back to static landmarks');
      }
    }

    // ─── Step 3: Default Curated Fallback ───────────────────────────────────
    if (!rawPlaces || rawPlaces.length === 0) {
      rawPlaces = getFallbackPlaces(cleanDestination);
      providerUsed = 'fallback';
      logger.info({ destination: cleanDestination, provider: 'fallback', count: rawPlaces.length }, 'Using static curated fallback suggestions');
    }

    // ─── Step 4: Server-Authoritative Gamification Rewards ──────────────────
    // calculateTaskReward() remains the ONLY source of truth for activity points
    const suggestions = rawPlaces.map((place, index) => {
      const name = place.name.trim() || `Place ${index + 1}`;
      const description = (place.description || '').trim();
      const points = calculateTaskReward({ name, description });
      return {
        name,
        description,
        points,
        isSelected: true,
      };
    });

    return apiSuccess({
      suggestions,
      places: suggestions,
      provider: providerUsed,
    }, 200);
  } catch (error) {
    logger.error({ err: error }, 'Unhandled error in suggestions endpoint');
    return apiError('Failed to get suggestions', 'INTERNAL_SERVER_ERROR', 500);
  }
}