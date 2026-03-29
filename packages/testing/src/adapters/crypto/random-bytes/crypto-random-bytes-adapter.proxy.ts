/**
 * PURPOSE: Proxy for crypto-random-bytes-adapter
 *
 * USAGE:
 * const proxy = cryptoRandomBytesAdapterProxy();
 * proxy.returns({ length: 16, bytes: Buffer.from('test') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { randomBytes } from 'crypto';
import { registerMock } from '../../../register-mock';

export const cryptoRandomBytesAdapterProxy = (): {
  returns: (params: { length: number; bytes: Buffer }) => void;
} => {
  const mock = registerMock({ fn: randomBytes });

  mock.mockReturnValue(Buffer.from('test'));

  return {
    returns: ({ bytes }: { length: number; bytes: Buffer }): void => {
      mock.mockReturnValueOnce(bytes);
    },
  };
};
