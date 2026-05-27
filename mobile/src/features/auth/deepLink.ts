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
  const queryString = url.split('?')[1] ?? '';
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
