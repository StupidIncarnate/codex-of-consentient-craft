import type { SettingsHookListEntry } from './settings-hook-list-entry-contract';
import { settingsHookListEntryContract } from './settings-hook-list-entry-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const SettingsHookListEntryStub = ({
  ...props
}: StubArgument<SettingsHookListEntry> = {}): SettingsHookListEntry =>
  settingsHookListEntryContract.parse({
    hooks: [{ type: 'command', command: 'their-hook' }],
    ...props,
  });
