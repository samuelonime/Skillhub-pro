function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9+#.]+/i)
    .map(token => token.trim())
    .filter(token => token.length >= 2);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function includesLoose(haystack, needle) {
  const left = normalizeText(haystack);
  const right = normalizeText(needle);
  return Boolean(left && right) && (left.includes(right) || right.includes(left));
}

function collectUserSkills(user) {
  return unique((user?.skills || []).map(skill => {
    if (typeof skill === 'string') return normalizeText(skill);
    return normalizeText(skill?.name);
  }));
}

function collectProfileKeywords(user) {
  return unique([
    ...tokenize(user?.interestNiche),
    ...tokenize(user?.title),
    ...tokenize(user?.bio),
    ...collectUserSkills(user),
  ]);
}

function scoreJobForUser(user, lead, options = {}) {
  const { includeNiche = true } = options;
  const matchedSkills = [];
  const reasons = [];
  let score = 10;

  const userSkills = collectUserSkills(user);
  const profileKeywords = collectProfileKeywords(user);
  const leadSkills = unique((lead?.skills || []).map(skill => normalizeText(skill)));
  const leadTitle = normalizeText(lead?.title);
  const leadDescription = normalizeText(lead?.description);
  const leadLocation = normalizeText(lead?.location);
  const userLocation = normalizeText(user?.location);
  const userNiche = normalizeText(user?.interestNiche);
  const leadNiche = normalizeText(lead?.niche);

  if (includeNiche && userNiche && leadNiche && userNiche === leadNiche) {
    score += 30;
    reasons.push(`Matched your ${user.interestNiche} niche`);
  }

  for (const skill of userSkills) {
    const matched = leadSkills.find(leadSkill => includesLoose(leadSkill, skill));
    if (matched) matchedSkills.push(skill);
  }

  const uniqueMatchedSkills = unique(matchedSkills);
  if (uniqueMatchedSkills.length) {
    score += Math.min(30, uniqueMatchedSkills.length * 10);
    reasons.push(`Skill overlap: ${uniqueMatchedSkills.slice(0, 4).join(', ')}`);
  }

  const keywordHits = unique(profileKeywords.filter(keyword => {
    if (uniqueMatchedSkills.includes(keyword)) return false;
    return includesLoose(leadTitle, keyword) || includesLoose(leadDescription, keyword);
  }));

  if (keywordHits.length) {
    score += Math.min(18, keywordHits.length * 6);
    reasons.push(`Role fit: ${keywordHits.slice(0, 3).join(', ')}`);
  }

  if (userLocation && leadLocation) {
    if (includesLoose(leadLocation, userLocation)) {
      score += 10;
      reasons.push(`Location match: ${user.location}`);
    } else if (leadLocation.includes('remote')) {
      score += 6;
      reasons.push('Remote-friendly role');
    }
  } else if (leadLocation.includes('remote')) {
    score += 6;
    reasons.push('Remote-friendly role');
  }

  if (lead?.salary) {
    score += 3;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedSkills: uniqueMatchedSkills,
    reasons: unique(reasons).slice(0, 4),
  };
}

module.exports = {
  collectUserSkills,
  scoreJobForUser,
};
