const CAREER_AI_URL = process.env.CAREER_AI_URL;
const INTERNAL_SECRET = process.env.CAREER_AI_INTERNAL_SECRET;

async function getOrCreateApiKey(userId) {
  // Check your own DB first — store the key once per user so you don't regenerate every call.
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { careerAiKey: true } });
  if (existing?.careerAiKey) return existing.careerAiKey;

  const res = await fetch(`${CAREER_AI_URL}/v1/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET },
    body: JSON.stringify({ userId }),
  });
  const { data } = await res.json();
  await prisma.user.update({ where: { id: userId }, data: { careerAiKey: data.apiKey } });
  return data.apiKey;
}

async function callCareerAi(userId, endpoint, body = {}) {
  const apiKey = await getOrCreateApiKey(userId);
  const res = await fetch(`${CAREER_AI_URL}/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ userId, ...body }),
  });
  return res.json();
}

module.exports = { callCareerAi };