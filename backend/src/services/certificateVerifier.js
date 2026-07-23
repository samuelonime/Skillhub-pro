const { URL } = require('url');

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function containsTerm(text, value) {
  const term = normalize(value);
  return term.length >= 3 && normalize(text).includes(term);
}

const PROVIDER_RULES = [
  { names: ['cisco', 'networking academy', 'netacad'], domains: ['netacad.com', 'cisco.com', 'credly.com'] },
  { names: ['coursera'], domains: ['coursera.org'] },
  { names: ['edx'], domains: ['edx.org'] },
  { names: ['udemy'], domains: ['udemy.com'] },
  { names: ['linkedin'], domains: ['linkedin.com'] },
  { names: ['pluralsight'], domains: ['pluralsight.com'] },
  { names: ['skillshare'], domains: ['skillshare.com'] },
  { names: ['alison'], domains: ['alison.com'] },
  { names: ['futurelearn'], domains: ['futurelearn.com'] },
];

function providerRuleFor(provider) {
  const normalized = normalize(provider);
  return PROVIDER_RULES.find(rule => rule.names.some(name => normalized.includes(name)));
}

function domainMatches(hostname, domains) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'localhost' || host === 'metadata.google.internal' || host === 'instance-data.ec2.internal') return true;
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host)) return true;
  const private172 = host.match(/^172\.(\d{1,3})\./);
  return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
}

/**
 * Check issuer-hosted verification pages without trusting an uploaded image/PDF.
 * A reachable page is only enough for verification when it also contains the
 * submitted certificate identity and the URL belongs to the claimed issuer.
 */
async function verifyCertificate({ title, provider, issueDate, credentialId, credentialUrl }) {
  if (!credentialUrl) {
    return { status: 'pending', reason: 'No issuer verification URL was provided.' };
  }

  let parsed;
  try {
    parsed = new URL(credentialUrl);
    if (parsed.protocol !== 'https:') {
      return { status: 'rejected', reason: 'Verification URL must use HTTPS.' };
    }
    if (isBlockedHost(parsed.hostname)) {
      return { status: 'rejected', reason: 'Verification URL points to a private or blocked host.' };
    }
  } catch {
    return { status: 'rejected', reason: 'Verification URL is invalid.' };
  }

  const providerRule = providerRuleFor(provider);
  if (!providerRule) {
    return { status: 'pending_review', reason: 'This provider does not have an automatic verification adapter yet.' };
  }
  if (!domainMatches(parsed.hostname, providerRule.domains)) {
    return { status: 'pending_review', reason: 'The verification link is not on a supported domain for this provider.' };
  }

  try {
    const response = await fetch(parsed, {
      headers: { Accept: 'text/html,application/xhtml+xml,text/plain' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!response.ok) {
      return { status: 'pending_review', reason: `Issuer verification page returned HTTP ${response.status}.` };
    }

    if (isBlockedHost(new URL(response.url).hostname)) {
      return { status: 'rejected', reason: 'Verification redirected to a private or blocked host.' };
    }

    const pageText = (await response.text()).slice(0, 2_000_000);
    const hasTitle = containsTerm(pageText, title);
    const hasCredentialId = credentialId ? containsTerm(pageText, credentialId) : false;
    const hasIssueYear = issueDate ? pageText.includes(String(new Date(issueDate).getUTCFullYear())) : true;

    if (hasTitle && (hasCredentialId || hasIssueYear)) {
      return { status: 'verified', reason: 'Issuer verification page matched the submitted certificate.' };
    }

      return { status: 'pending_review', reason: 'Issuer page was reachable but certificate details did not match.' };
  } catch {
    return { status: 'pending_review', reason: 'Issuer verification page could not be checked automatically.' };
  }
}

module.exports = { verifyCertificate };