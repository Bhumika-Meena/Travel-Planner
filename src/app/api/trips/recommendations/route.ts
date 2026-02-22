import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const { destination, startDate, endDate } = await request.json();

    if (!destination || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return NextResponse.json({
        recommendations: fallbackRecommendations,
        message: 'Using fallback recommendations due to missing API key'
      });
    }

    // Try to get recommendations from Gemini
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

      const prompt = `Generate a list of recommended places to visit in ${destination} between ${startDate} and ${endDate}. 
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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response text to ensure it's valid JSON
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      let recommendations;
      
      try {
        recommendations = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
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

      return NextResponse.json({ recommendations });
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      
      // If Gemini API fails, return fallback recommendations
      return NextResponse.json({
        recommendations: fallbackRecommendations,
        message: 'Using fallback recommendations due to API limitations'
      });
    }
  } catch (error: any) {
    console.error('Recommendations error:', error);
    
    // If everything fails, return fallback recommendations
    return NextResponse.json({
      recommendations: fallbackRecommendations,
      message: 'Using fallback recommendations due to an error'
    });
  }
} 