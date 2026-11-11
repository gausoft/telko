const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteverifyAnswer {
  success: boolean;
}

/** Asks Cloudflare whether the token is genuine. A token works once and expires after 300 seconds. */
export async function verifyToken(secret: string, token: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  const response = await fetch(SITEVERIFY, { method: 'POST', body });
  if (!response.ok) return false;

  const answer = (await response.json()) as SiteverifyAnswer;

  return answer.success === true;
}
