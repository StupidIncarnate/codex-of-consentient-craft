import { cryptoHashAdapterProxy } from '../../../adapters/crypto/hash/crypto-hash-adapter.proxy';

// Both steps this broker composes are pure and deterministic (a transformer, and a crypto adapter
// with nothing to mock) — the test needs the REAL digest to prove canonical-ordering stability and
// content sensitivity, so cryptoHashAdapterProxy is called only to satisfy
// enforce-proxy-child-creation, never to stage a value.
export const laneSpecHashBrokerProxy = (): Record<PropertyKey, never> => {
  cryptoHashAdapterProxy();
  return {};
};
