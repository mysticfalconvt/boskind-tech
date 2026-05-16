import pako from 'pako';
import { TravelBudgetData } from './types';
import { sanitizeObject, validateTravelBudgetData } from './storage';

function toUrlSafeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromUrlSafeBase64(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function encodeShareLink(data: TravelBudgetData): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json);
  return toUrlSafeBase64(compressed);
}

export function decodeShareLink(param: string): TravelBudgetData | null {
  if (!param) return null;
  try {
    const bytes = fromUrlSafeBase64(param);
    const json = pako.inflate(bytes, { to: 'string' });
    const parsed = JSON.parse(json);
    if (!validateTravelBudgetData(parsed)) return null;
    return sanitizeObject(parsed) as TravelBudgetData;
  } catch (error) {
    console.error('Error decoding share link:', error);
    return null;
  }
}

export function buildShareUrl(data: TravelBudgetData): string {
  const encoded = encodeShareLink(data);
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/travelBudget?d=${encoded}`;
}
