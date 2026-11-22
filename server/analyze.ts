import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { Connect } from 'vite';
import type { Plugin } from 'vite';

// Runs only on the server (Vite dev/preview middleware). The API key never
// reaches the browser bundle.

const CATEGORIES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'General Repair',
  'Safety & Access',
  'Other',
] as const;
const PRIORITIES = ['High', 'Medium', 'Low'] as const;

const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
// Per-model cap so one overloaded model can't eat the whole request budget.
const PER_MODEL_TIMEOUT_MS = 25000;

const MAX_BODY_BYTES = 12 * 1024 * 1024;

export interface AnalyzeRequest {
  building: string;
  room: string;
  description: string;
  image?: { mimeType: string; data: string } | null; // base64, no data: prefix
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    classification: {
      type: 'string',
      description: 'Short issue title, 3-7 words, e.g. "Leaking Ceiling AC Unit".',
    },
    category: { type: 'string', enum: [...CATEGORIES] },
    categoryDisplay: {
      type: 'string',
      description: 'Human-friendly category label, e.g. "HVAC (Air Conditioning)".',
    },
    confidence: {
      type: 'integer',
      description: 'Confidence in the classification, 0-100.',
    },
    suggestedPriority: { type: 'string', enum: [...PRIORITIES] },
    generatedDescription: {
      type: 'string',
      description:
        'Two sentences for the technician, under 240 characters total: what is wrong and where, then the risk or recommended action.',
    },
  },
  required: [
    'classification',
    'category',
    'categoryDisplay',
    'confidence',
    'suggestedPriority',
    'generatedDescription',
  ],
};

const SYSTEM_PROMPT = `You are the triage engine for a university facilities maintenance desk.
A student reports a problem with a photo and/or a short description. Classify it for the maintenance team.

Priority rules:
- High: safety risk (exposed wiring, sparks, water near electrics, broken locks or fire doors, elevator trapping risk), active water leaks, or anything that stops a room from being used.
- Medium: degraded but usable (flickering light, weak cooling, slow drain, broken furniture).
- Low: cosmetic or minor (scuffs, loose fittings, small stains).

Base the answer on what the photo actually shows; use the description for context.
If photo and description disagree, trust the photo and lower the confidence.
If the photo does not show a maintenance issue, use category "Other" and a confidence below 40.
Write in clear English. Mention the building and room in generatedDescription.`;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: PER_MODEL_TIMEOUT_MS } });
  return client;
}

type Part = Record<string, unknown>;

/**
 * Gemini models are often overloaded (503) or stall. Ask them all at once and
 * use whichever returns valid JSON first.
 */
async function generateJson(
  label: string,
  parts: Part[],
  systemInstruction: string,
  schema: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const ai = getClient();
  if (!ai) throw new Error('GEMINI_API_KEY is not set');
  const models = [process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(
    (m, i, all): m is string => !!m && all.indexOf(m) === i,
  );
  const attempts = models.map(async (model) => {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          temperature: 0.2,
          // Quick visual judgements; long thinking only adds latency.
          ...(model.startsWith('gemini-3')
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      const parsed = JSON.parse(response.text ?? '');
      console.log(`[api/${label}] answered by ${model}`);
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[api/${label}] ${model} failed: ${msg.slice(0, 100)}`);
      throw err;
    }
  });
  try {
    return await Promise.any(attempts);
  } catch {
    throw new Error('All Gemini models failed or timed out');
  }
}

const clampConfidence = (n: unknown) =>
  Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export async function analyzeIssue(req: AnalyzeRequest) {
  const parts: Part[] = [];
  if (req.image?.data) {
    parts.push({ inlineData: { mimeType: req.image.mimeType, data: req.image.data } });
  }
  parts.push({
    text: `Location: ${req.building}, ${req.room}
Student description: ${req.description || '(none)'}`,
  });

  const raw = await generateJson('analyze', parts, SYSTEM_PROMPT, RESPONSE_SCHEMA);
  const category = CATEGORIES.includes(raw.category) ? raw.category : 'Other';
  const suggestedPriority = PRIORITIES.includes(raw.suggestedPriority)
    ? raw.suggestedPriority
    : 'Medium';

  return {
    classification: String(raw.classification || 'Facility Maintenance Issue'),
    category,
    categoryDisplay: String(raw.categoryDisplay || category),
    confidence: clampConfidence(raw.confidence),
    suggestedPriority,
    generatedDescription: String(raw.generatedDescription || req.description),
  };
}

// ---- Repair verification: compare before/after photos ----

export interface VerifyRequest {
  issue: string;
  location: string;
  before: { mimeType: string; data: string };
  after: { mimeType: string; data: string };
}

const VERDICTS = ['resolved', 'not_resolved', 'unclear'] as const;

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: [...VERDICTS],
      description:
        'resolved: the after photo shows the fault fixed. not_resolved: the fault is still visible. unclear: the photos do not show the same fixture or the after photo is unusable.',
    },
    confidence: { type: 'integer', description: 'Confidence in the verdict, 0-100.' },
    summary: {
      type: 'string',
      description:
        'One sentence, under 160 characters, naming what changed (or did not) between the two photos.',
    },
  },
  required: ['verdict', 'confidence', 'summary'],
};

const VERIFY_PROMPT = `You are the quality check for a university facilities maintenance desk.
You get the photo a student submitted (BEFORE) and the photo the technician took after the repair (AFTER).
Decide whether the AFTER photo shows the reported fault fixed.
Be strict: if the same fault is still visible (water, leak stains that are still wet, a light still out, damage unchanged), the verdict is not_resolved.
If the AFTER photo shows a different place or object, or is too unclear to judge, the verdict is unclear.
Describe only what you can see.`;

export async function verifyRepair(req: VerifyRequest) {
  const raw = await generateJson(
    'verify',
    [
      { text: `Reported issue: ${req.issue}
Location: ${req.location}
BEFORE photo:` },
      { inlineData: req.before },
      { text: 'AFTER photo:' },
      { inlineData: req.after },
    ],
    VERIFY_PROMPT,
    VERIFY_SCHEMA,
  );
  return {
    verdict: VERDICTS.includes(raw.verdict) ? raw.verdict : 'unclear',
    confidence: clampConfidence(raw.confidence),
    summary: String(raw.summary || ''),
  };
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const handler: Connect.NextHandleFunction = async (req, res, next) => {
  const route = req.url === '/api/analyze' || req.url === '/api/verify' ? req.url : null;
  if (!route) return next();
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req);
    const result =
      route === '/api/verify'
        ? await verifyRepair(body as VerifyRequest)
        : await analyzeIssue(body as AnalyzeRequest);
    res.end(JSON.stringify(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${route}]`, message);
    res.statusCode = message.includes('not set') ? 503 : 502;
    res.end(JSON.stringify({ error: message }));
  }
};

export function analyzeApiPlugin(): Plugin {
  return {
    name: 'campusfix-analyze-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
