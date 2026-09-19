/**
 * PURPOSE: Builds a valid `SessionFields` for a test that needs one but does not care which id,
 * directory or lines it carries.
 *
 * USAGE:
 * SessionFieldsStub({ sessionId: 'seed-session-1' });
 * // Returns SessionFields
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { StreamJsonLineStub } from '@dungeonmaster/shared/contracts';

import { sessionFieldsContract } from './session-fields-contract';
import type { SessionFields } from './session-fields-contract';

export const SessionFieldsStub = ({ ...props }: StubArgument<SessionFields> = {}): SessionFields =>
  sessionFieldsContract.parse({
    sessionId: 'seed-session-1',
    cwd: '/tmp/session-fields-stub/guild-1',
    lines: [StreamJsonLineStub()],
    ...props,
  });
