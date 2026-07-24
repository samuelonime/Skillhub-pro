const prisma = require('../config/database');

const CAREER_AI_URL = process.env.CAREER_AI_URL;
const INTERNAL_SECRET = process.env.CAREER_AI_INTERNAL_SECRET;

async function getOrCreateApiKey(userId) {
  if (!CAREER_AI_URL) throw new Error('CAREER_AI_URL is not set');
  if (!INTERNAL_SECRET) throw new Error('CAREER_AI_INTERNAL_SECRET is not set');

  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { careerAiKey: true } });
  if (existing?.careerAiKey) return existing.careerAiKey;

  const res = await fetch(`${CAREER_AI_URL}/v1/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`career-ai /v1/keys failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const { data } = await res.json();
  await prisma.user.update({ where: { id: userId }, data: { careerAiKey: data.apiKey } });
  return data.apiKey;
}

async function callCareerAi(userId, endpoint, body = {}) {
  if (!CAREER_AI_URL) throw new Error('CAREER_AI_URL is not set');

  const apiKey = await getOrCreateApiKey(userId);
  const res = await fetch(`${CAREER_AI_URL}/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ userId, ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`career-ai ${endpoint} failed: ${res.status} ${text.slice(0, 200)}`);
  }

  return res.json();
}

module.exports = { callCareerAi, getOrCreateApiKey };