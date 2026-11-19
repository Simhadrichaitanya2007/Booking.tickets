import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getConfiguredGeminiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY?.trim();
  if (!raw || raw === 'MY_GEMINI_API_KEY' || raw === 'undefined') {
    return null;
  }
  return raw;
}

const RAILMATE_SYSTEM_INSTRUCTION = `You are RailMate AI, the friendly Indian rail travel assistant inside the "AI Rail Journey" web prototype.

Strict truthfulness & prototype rules:
- AI Rail Journey is an interactive portfolio prototype and is NOT affiliated with IRCTC or Indian Railways.
- Never claim to check live PNR status, live train running status, or real-time seat inventory.
- Clarify when relevant that fares, timings, and availability shown in the app are sample prototype figures.

Helpful guidance you provide:
- Compare Indian Railways travel classes clearly:
  - Sleeper (SL): Non-AC 3-tier open-window sleeper (8 berths per bay: LB, MB, UB, SL, SU). Budget-friendly.
  - AC 3 Tier (3AC): Climate-controlled 3-tier sleeper (8 berths per bay) with bedding included. Best value for overnight comfort.
  - AC 2 Tier (2AC): Spacious 2-tier AC sleeper (6 berths per bay: LB, UB, SL, SU) with privacy curtains and extra legroom.
  - First AC (1AC): Private lockable 4-berth cabins and 2-berth coupes, carpeted floors, wide berths, personalized meals on Rajdhani/Duronto.
  - AC Chair Car (CC): 3+2 reclining day seating with large panoramic windows on Shatabdi and Vande Bharat Express trains.
- Suggest popular corridors (Delhi-Mumbai, Delhi-Bengaluru, Hyderabad-Bengaluru, Mumbai-Goa Konkan scenic route, Chennai-Bengaluru, Delhi-Hyderabad) and practical travel tips (berth selection for seniors, packing light, reaching stations 30 mins early, carrying valid government ID).
- Keep responses concise, structured, and easy to scan in a compact chat drawer (under 140 words unless asked for detail).`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'AI Rail Journey Prototype' });
  });

  app.get('/api/assistant/status', (_req, res) => {
    const geminiConfigured = Boolean(getConfiguredGeminiKey());
    res.json({
      geminiConfigured,
      mode: geminiConfigured ? 'gemini' : 'demo',
      model: geminiConfigured ? 'gemini-4-hydrogen' : null,
    });
  });

  app.post('/api/assistant', async (req, res) => {
    const apiKey = getConfiguredGeminiKey();
    if (!apiKey) {
      res.status(503).json({
        configured: false,
        error: 'Gemini API is not configured in this environment. Switch to Demo Assistant mode.',
      });
      return;
    }

    const { message, history, searchContext } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
      searchContext?: {
        from?: string;
        to?: string;
        date?: string;
        travelClass?: string;
      };
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Please enter a message for RailMate AI.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextSummary = searchContext
        ? `\nCurrent user search context in app: From=${searchContext.from || 'not selected'}, To=${searchContext.to || 'not selected'}, Date=${searchContext.date || 'not selected'}, Class=${searchContext.travelClass || 'not selected'}.`
        : '';

      const contents = [
        ...(Array.isArray(history)
          ? history.slice(-8).map((turn) => ({
              role: turn.role === 'model' ? 'model' : 'user',
              parts: [{ text: String(turn.text || '') }],
            }))
          : []),
        {
          role: 'user',
          parts: [{ text: message.trim() }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: RAILMATE_SYSTEM_INSTRUCTION + contextSummary,
        },
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        res.status(502).json({
          error: 'RailMate AI received an empty response from the model. Please try again.',
        });
        return;
      }

      res.json({
        configured: true,
        source: 'gemini',
        model: 'gemini-4-hydrogen',
        reply: replyText,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Unexpected error communicating with Gemini API.';
      const status =
        errMessage.includes('403') || errMessage.includes('PERMISSION_DENIED')
          ? 403
          : errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 500;

      res.status(status).json({
        configured: true,
        error: `Gemini API error: ${errMessage}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Rail Journey server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start AI Rail Journey server:', error);
  process.exit(1);
});
