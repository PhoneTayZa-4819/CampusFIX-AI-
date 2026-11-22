import { AiAnalysisResult, RepairVerification } from '../types/campusFix';
import { classifyIssueInput } from './campusFixStore';

const MAX_IMAGE_EDGE = 1280;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Loads any image URL (data: URL or bundled asset) and re-encodes it as a
 * downscaled JPEG, so phone photos don't send megabytes to the API.
 */
async function toBase64Jpeg(src: string): Promise<{ mimeType: string; data: string }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { mimeType: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1) };
}

/**
 * Real AI triage through the server-side /api/analyze endpoint (Gemini).
 * Falls back to the local keyword classifier if the API is unavailable,
 * so the demo never breaks.
 */
export async function analyzeIssue(params: {
  building: string;
  room: string;
  description: string;
  photoUrl: string | null;
  sampleId?: string | null;
  fileName?: string;
}): Promise<AiAnalysisResult> {
  const fallback = () =>
    classifyIssueInput({
      sampleId: params.sampleId,
      building: params.building,
      room: params.room,
      description: params.description,
      fileName: params.fileName,
    });

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const image = params.photoUrl ? await toBase64Jpeg(params.photoUrl) : null;
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        building: params.building,
        room: params.room,
        description: params.description,
        image,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return { ...(await res.json()), source: 'gemini' };
  } catch (err) {
    console.warn('[CampusFix] Gemini analysis unavailable, using local classifier:', err);
    return { ...fallback(), source: 'fallback' };
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Asks Gemini whether the after-repair photo shows the fault fixed.
 * Returns null if the AI check is unavailable.
 */
export async function verifyRepairPhotos(params: {
  beforeUrl: string;
  afterUrl: string;
  issue: string;
  location: string;
}): Promise<RepairVerification | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const [before, after] = await Promise.all([
      toBase64Jpeg(params.beforeUrl),
      toBase64Jpeg(params.afterUrl),
    ]);
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue: params.issue, location: params.location, before, after }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return (await res.json()) as RepairVerification;
  } catch (err) {
    console.warn('[CampusFix] Repair verification unavailable:', err);
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
