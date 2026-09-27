import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { getAuthSession } from '@/lib/auth';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const session = await getAuthSession(request);
    const rateLimitKey = session?.userId ? `ai-sug:user:${session.userId}` : `ai-sug:ip:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before requesting suggestions again.' },
        { status: 429 }
      );
    }

    const { destination, startDate, endDate } = await request.json();

    // Validate required fields
    if (!destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof destination !== 'string' || destination.trim().length === 0 || destination.length > 100) {
      return NextResponse.json(
        { error: 'Destination must be a text between 1 and 100 characters' },
        { status: 400 }
      );
    }

    const cleanDestination = destination.trim().slice(0, 100);

    // Calculate trip duration in days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.max(1, Math.min(30, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));

    let suggestions;

    try {
      if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HuggingFace API key not configured');
      }

      // Generate prompt for the model
      const prompt = `Generate 7-10 interesting places to visit in ${cleanDestination} for a ${duration}-day trip. 
      For each place, provide a brief description of what makes it special and why it's worth visiting.
      Format the response as a JSON array with objects containing 'name', 'description', and 'points' fields.
      The points should be between 1 and 5 based on how interesting the place is.`;

      // Call Hugging Face API with 8-second timeout
      const textGenPromise = hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('HuggingFace API timed out')), 8000)
      );

      const response = await Promise.race([textGenPromise, timeoutPromise]);

      // Parse the response and format it
      try {
        // Extract JSON from the response
        const jsonMatch = response.generated_text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response');
      }
    } catch (apiError) {
      console.error('Error getting AI suggestions:', apiError);
      // Fallback to default suggestions if API call fails
      suggestions = [
      {
        name: `${destination} City Center`,
        description: 'Explore the heart of the city with its main attractions and cultural landmarks.',
        points: 2,
        isSelected: true
      },
      {
        name: 'Local Market',
        description: 'Experience local culture and cuisine at the bustling market.',
        points: 2,
        isSelected: true
      },
      {
        name: 'Historical Museum',
        description: 'Learn about the rich history and heritage of the destination.',
        points: 2,
        isSelected: true
      },
      {
        name: 'Scenic Park',
        description: 'Relax and enjoy the natural beauty of the area.',
        points: 2,
        isSelected: true
      },
      {
        name: 'Local Restaurant',
        description: 'Taste authentic local cuisine at a traditional restaurant.',
        points: 2,
        isSelected: true
        },
        {
          name: 'Religious Site',
          description: 'Visit a significant religious or spiritual location in the area.',
          points: 2,
          isSelected: true
        },
        {
          name: 'Art Gallery',
          description: 'Appreciate local and international art at a renowned gallery.',
          points: 2,
          isSelected: true
        },
        {
          name: 'Viewpoint',
          description: 'Take in panoramic views of the city and surrounding landscape.',
          points: 2,
          isSelected: true
        },
        {
          name: 'Cultural Center',
          description: 'Experience traditional performances and cultural exhibitions.',
          points: 2,
          isSelected: true
        },
        {
          name: 'Shopping District',
          description: 'Explore local boutiques and shops for unique souvenirs.',
          points: 2,
          isSelected: true
      }
    ];
    }

    // Ensure all suggestions have the required fields
    suggestions = suggestions.map((place: any) => ({
      name: place.name || 'Unknown Place',
      description: place.description || 'No description available',
      points: Math.min(Math.max(place.points || 2, 1), 5),
      isSelected: true
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in suggestions endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
} 