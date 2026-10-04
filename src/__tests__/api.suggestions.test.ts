/**
 * Integration tests for POST /api/trips/suggestions.
 * Tests the fallback chain and diagnostic instrumentation: Gemini -> Hugging Face -> Static Fallback.
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

const mockGenerateContent = jest.fn();
const mockChatCompletion = jest.fn();

// Mock @google/genai
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    STRING: 'STRING',
  },
}));

// Mock @huggingface/inference
jest.unstable_mockModule('@huggingface/inference', () => ({
  HfInference: jest.fn().mockImplementation(() => ({
    chatCompletion: mockChatCompletion,
  })),
}));

// Import route after mocks
const { POST } = await import('@/app/api/trips/suggestions/route');

function makeRequest(body?: Record<string, unknown>): Request {
  const defaultBody = {
    destination: 'Rome',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    ...body,
  };
  return new Request('http://localhost/api/trips/suggestions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(defaultBody),
  });
}

describe('POST /api/trips/suggestions', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 if destination is missing or empty', async () => {
    const res = await POST(makeRequest({ destination: '' }) as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns Gemini AI suggestions when GEMINI_API_KEY is valid and Gemini succeeds', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyRealKeyForTesting1234567890';

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify([
        { name: 'Colosseum', description: 'Ancient amphitheatre in the centre of the city of Rome' },
        { name: 'Pantheon', description: 'Former Roman temple, now a church in Rome with historic dome' },
      ]),
    });

    const res = await POST(makeRequest({ destination: 'Rome' }) as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('gemini');
    expect(data.places).toHaveLength(2);
    expect(data.places[0].name).toBe('Colosseum');
    // Verify points are calculated by calculateTaskReward
    expect([10, 12, 15]).toContain(data.places[0].points);
    expect([10, 12, 15]).toContain(data.places[1].points);
    expect(mockChatCompletion).not.toHaveBeenCalled();

    // Verify diagnostics metadata
    expect(data.diagnostics).toEqual({
      gemini: {
        attempted: true,
        status: 'success',
        error: null,
      },
      huggingface: {
        attempted: false,
        status: 'skipped',
        error: null,
      },
    });
  });

  it('falls back to Hugging Face if Gemini fails or times out', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyRealKeyForTesting1234567890';
    process.env.HUGGINGFACE_API_KEY = 'hf_realTokenForTesting1234567890';

    // Gemini throws an error
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API 503 Unavailable'));

    // Hugging Face returns chat completion
    mockChatCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify([
              { name: 'Trevi Fountain', description: 'Famous Baroque fountain in Rome' },
            ]),
          },
        },
      ],
    });

    const res = await POST(makeRequest({ destination: 'Rome' }) as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('huggingface');
    expect(data.places).toHaveLength(1);
    expect(data.places[0].name).toBe('Trevi Fountain');
    expect([10, 12, 15]).toContain(data.places[0].points);

    // Verify diagnostics metadata
    expect(data.diagnostics.gemini.attempted).toBe(true);
    expect(data.diagnostics.gemini.status).toBe('failed');
    expect(data.diagnostics.gemini.error).toContain('503 Unavailable');

    expect(data.diagnostics.huggingface).toEqual({
      attempted: true,
      status: 'success',
      error: null,
    });
  });

  it('falls back to static landmarks if both Gemini and Hugging Face fail', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyRealKeyForTesting1234567890';
    process.env.HUGGINGFACE_API_KEY = 'hf_realTokenForTesting1234567890';

    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini model not found: 404'));
    mockChatCompletion.mockRejectedValueOnce(new Error('HuggingFace 401 Unauthorized token'));

    const res = await POST(makeRequest({ destination: 'Tokyo' }) as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('fallback');
    expect(data.places).toHaveLength(10);
    // All places have points calculated
    for (const place of data.places) {
      expect([10, 12, 15]).toContain(place.points);
      expect(place.isSelected).toBe(true);
    }

    // Verify diagnostics metadata
    expect(data.diagnostics).toEqual({
      gemini: {
        attempted: true,
        status: 'failed',
        error: expect.stringContaining('404'),
      },
      huggingface: {
        attempted: true,
        status: 'failed',
        error: expect.stringContaining('401'),
      },
    });
  });

  it('falls back directly when keys are placeholders without calling API', async () => {
    process.env.GEMINI_API_KEY = 'AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    process.env.HUGGINGFACE_API_KEY = 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    const res = await POST(makeRequest({ destination: 'London' }) as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.provider).toBe('fallback');
    expect(mockGenerateContent).not.toHaveBeenCalled();
    expect(mockChatCompletion).not.toHaveBeenCalled();

    // Verify diagnostics metadata indicates skipped due to placeholder
    expect(data.diagnostics).toEqual({
      gemini: {
        attempted: false,
        status: 'skipped',
        error: 'GEMINI_API_KEY is a placeholder',
      },
      huggingface: {
        attempted: false,
        status: 'skipped',
        error: 'HUGGINGFACE_API_KEY is a placeholder',
      },
    });
  });
});
