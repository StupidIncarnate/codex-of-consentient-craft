/**
 * PURPOSE: Proxy for crypto-random-bytes-adapter
 *
 * USAGE:
 * const proxy = cryptoRandomBytesAdapterProxy();
 * proxy.returns({ length: 16, bytes: Buffer.from('test') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { randomBytes } from 'crypto';

jest.mock('crypto');

export const cryptoRandomBytesAdapterProxy = (): {
  returns: (params: { length: number; bytes: Buffer }) => void;
} => {
  const mock = jest.mocked(randomBytes) as unknown as jest.MockedFunction<(size: number) => Buffer>;

  mock.mockReturnValue(Buffer.from('test'));

  return {
    returns: ({ bytes }: { length: number; bytes: Buffer }): void => {
      mock.mockReturnValueOnce(bytes);
    },
  };
};
