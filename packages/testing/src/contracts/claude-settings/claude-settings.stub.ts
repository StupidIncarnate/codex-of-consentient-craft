import type { StubArgument } from '@dungeonmaster/shared/@types';
import { claudeSettingsContract } from './claude-settings-contract';
import type { ClaudeSettings } from './claude-settings-contract';

export const ClaudeSettingsStub = ({
  ...props
}: StubArgument<ClaudeSettings> = {}): ClaudeSettings => claudeSettingsContract.parse({ ...props });
