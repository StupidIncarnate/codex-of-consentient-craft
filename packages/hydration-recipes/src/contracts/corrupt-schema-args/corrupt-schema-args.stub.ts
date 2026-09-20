/**
 * PURPOSE: Builds a valid `CorruptSchemaArgs` for a test that needs one — always the empty object,
 * since the extra takes no arguments.
 *
 * USAGE:
 * CorruptSchemaArgsStub();
 * // Returns CorruptSchemaArgs
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { corruptSchemaArgsContract } from './corrupt-schema-args-contract';
import type { CorruptSchemaArgs } from './corrupt-schema-args-contract';

export const CorruptSchemaArgsStub = ({
  ...props
}: StubArgument<CorruptSchemaArgs> = {}): CorruptSchemaArgs =>
  corruptSchemaArgsContract.parse({ ...props });
