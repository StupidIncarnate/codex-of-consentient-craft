/**
 * PURPOSE: Proxy for crypto-random-bytes-adapter
 *
 * USAGE:
 * const proxy = cryptoRandomBytesAdapterProxy();
 * proxy.returns({ length: 4, bytes: Buffer.from('test') });
 * // Works in ts-jest context, gracefully degrades when imported from dist
 */

import { randomBytes } from 'crypto';
import { registerMock } from '../../../register-mock';

export const cryptoRandomBytesAdapterProxy = (): {
  returns: (params: { length: number; bytes: Buffer }) => void;
} => {
  const mock = registerMock({ fn: randomBytes });

  // Catch-all: install-testbed-create-broker.proxy and integration-environment-create-broker.proxy
  // build this adapter without describing any call of their own.
  mock.calledWith([]).returns(Buffer.from('test'));

  return {
    returns: ({ length, bytes }: { length: number; bytes: Buffer }): void => {
      mock.calledWith([length]).returns(bytes);
    },
  };
};
