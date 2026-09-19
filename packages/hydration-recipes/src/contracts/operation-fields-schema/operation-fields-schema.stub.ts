/**
 * PURPOSE: Builds a valid `OperationFields` through `operationFieldsSchemaContract` rather than
 * `operationFieldsContract` directly — same defaults `OperationFieldsStub` uses, so a test proving
 * the two contracts parse identically never hand-writes two divergent literals.
 *
 * USAGE:
 * OperationFieldsSchemaStub({ role: 'riftcarver' });
 * // Returns OperationFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { operationFieldsSchemaContract } from './operation-fields-schema-contract';
import type { OperationFields } from '../operation-fields/operation-fields-contract';

export const OperationFieldsSchemaStub = ({
  ...props
}: StubArgument<OperationFields> = {}): OperationFields =>
  operationFieldsSchemaContract.parse({
    text: 'Seeded operation 1',
    role: 'codeweaver',
    status: 'pending',
    questId: 'add-auth',
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
