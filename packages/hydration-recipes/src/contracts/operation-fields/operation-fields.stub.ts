/**
 * PURPOSE: Builds a valid `OperationFields` for a test that needs one but does not care which
 * text, role or ledger position it carries.
 *
 * USAGE:
 * OperationFieldsStub({ questId: 'add-auth', guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns OperationFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { operationFieldsContract } from './operation-fields-contract';
import type { OperationFields } from './operation-fields-contract';

export const OperationFieldsStub = ({
  ...props
}: StubArgument<OperationFields> = {}): OperationFields =>
  operationFieldsContract.parse({
    text: 'Seeded operation 1',
    role: 'codeweaver',
    status: 'pending',
    questId: 'add-auth',
    guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
