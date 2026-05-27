import { type Provider } from '../../shared/api/types';

const CALLBACK_PREFIX = 'nthing://auth/callback';

export type AuthCallbackParams = {
  provider: Provider;
  code?: string;
  state?: string;
  error?: string;
};

export function parseAuthCallback(url: string): AuthCallbackParams | null {
  if (!url.startsWith(CALLBACK_PREFIX)) return null;
  // CALLBACK_PREFIX 와 정확히 일치하거나 바로 '?' 가 와야 함 (nthing://auth/callbackfoo 류 거부)
  const rest = url.slice(CALLBACK_PREFIX.length);
  if (rest !== '' && !rest.startsWith('?')) return null;
  const queryString = rest.startsWith('?') ? rest.slice(1) : '';
  const params = new URLSearchParams(queryString);
  const provider = params.get('provider');
  if (!provider) return null;
  return {
    provider: provider as Provider,
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
  };
}
