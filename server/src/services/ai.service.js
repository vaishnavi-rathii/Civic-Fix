import Anthropic from '@anthropic-ai/sdk';

let client;
function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const VALID_CATEGORIES = [
  'POTHOLE', 'STREETLIGHT', 'GARBAGE', 'DRAINAGE', 'WATER_SUPPLY',
  'SEWAGE', 'ENCROACHMENT', 'NOISE', 'STRAY_ANIMALS', 'TREE_FALLEN',
  'ROAD_DAMAGE', 'PUBLIC_PROPERTY', 'OTHER',
];

// Simple in-memory cache for identical requests
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function classifyIssue(title, description) {
  const cacheKey = `${title}::${description}`.slice(0, 200);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.result;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { category: 'OTHER', confidence: 0, summary: 'AI classification unavailable' };
  }

  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a civic issue classifier for Indian municipalities. Classify this issue and return ONLY valid JSON.

Issue title: "${title}"
Issue description: "${description}"

Return JSON with exactly these fields:
{
  "category": one of [POTHOLE, STREETLIGHT, GARBAGE, DRAINAGE, WATER_SUPPLY, SEWAGE, ENCROACHMENT, NOISE, STRAY_ANIMALS, TREE_FALLEN, ROAD_DAMAGE, PUBLIC_PROPERTY, OTHER],
  "confidence": number between 0 and 1,
  "summary": "one sentence summary for admin dashboard"
}

Return only the JSON object, no other text.`,
      }],
    });

    const text = msg.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    const result = {
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'OTHER',
      confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
    };

    cache.set(cacheKey, { result, ts: Date.now() });
    return result;
  } catch (err) {
    console.error('AI classify error:', err.message);
    return { category: 'OTHER', confidence: 0, summary: '' };
  }
}

export async function suggestResolution(issue) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { suggestions: 'AI suggestions unavailable. Please configure ANTHROPIC_API_KEY.' };
  }

  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a municipal administration assistant for Indian cities. Provide resolution guidance for this civic issue.

Issue: "${issue.title}"
Description: "${issue.description}"
Category: ${issue.category}
Location: ${issue.address}, ${issue.city}
Days since reported: ${Math.floor((Date.now() - new Date(issue.createdAt)) / 86400000)}
Upvotes: ${issue._count?.votes || 0}

Provide a structured response with:
1. Likely cause
2. Recommended municipal department to handle this
3. Typical resolution time for this category
4. Step-by-step action items (numbered list)
5. Priority level (High/Medium/Low) and reasoning

Keep the response practical and specific to Indian municipal context.`,
      }],
    });

    return { suggestions: msg.content[0].text };
  } catch (err) {
    console.error('AI suggest error:', err.message);
    throw new Error('AI suggestion service temporarily unavailable');
  }
}
