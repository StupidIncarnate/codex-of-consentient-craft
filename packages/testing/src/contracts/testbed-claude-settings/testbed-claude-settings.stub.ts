import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testbedClaudeSettingsContract } from './testbed-claude-settings-contract';
import type { TestbedClaudeSettings } from './testbed-claude-settings-contract';

export const TestbedClaudeSettingsStub = ({
  ...props
}: StubArgument<TestbedClaudeSettings> = {}): TestbedClaudeSettings =>
  testbedClaudeSettingsContract.parse({ ...props });
