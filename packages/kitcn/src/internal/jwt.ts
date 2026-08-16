const VOLATILE_JWT_CLAIMS = new Set(['exp', 'iat', 'jti', 'nbf']);

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const segment = token.split('.')[1];
    if (!segment) {
      return null;
    }

    const binary = atob(segment.replaceAll('-', '+').replaceAll('_', '/'));
    const payload: unknown = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(binary, (char) => char.charCodeAt(0))
      )
    );

    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, claim]) => claim !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1));

  return `{${entries
    .map(([key, claim]) => `${JSON.stringify(key)}:${stableStringify(claim)}`)
    .join(',')}}`;
};

export const decodeJwtExp = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? Number(payload.exp) * 1000 : null;
};

export const decodeJwtIdentity = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const claims: Record<string, unknown> = {};
  for (const [key, claim] of Object.entries(payload)) {
    if (!VOLATILE_JWT_CLAIMS.has(key)) {
      claims[key] = claim;
    }
  }

  return stableStringify(claims);
};
