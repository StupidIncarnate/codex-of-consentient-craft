/**
 * PURPOSE: Stub factory for CallbackKey branded type
 *
 * USAGE:
 * const key = CallbackKeyStub();
 * // Returns: 'onClick'
 */

import { callbackKeyContract } from './callback-key-contract';
import type { CallbackKey } from './callback-key-contract';

export const CallbackKeyStub = ({ value }: { value: string } = { value: 'onClick' }): CallbackKey =>
  callbackKeyContract.parse(value);
