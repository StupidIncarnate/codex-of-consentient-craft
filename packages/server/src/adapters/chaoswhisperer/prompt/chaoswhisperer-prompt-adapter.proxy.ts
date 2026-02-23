jest.mock('@dungeonmaster/orchestrator');

import { chaoswhispererPromptStatics } from '@dungeonmaster/orchestrator';

export const chaoswhispererPromptAdapterProxy = (): {
  setup: () => void;
} => ({
  setup: (): void => {
    Reflect.set(chaoswhispererPromptStatics, 'prompt', {
      template: 'default-template {{ARGUMENTS}}',
      placeholders: { arguments: '{{ARGUMENTS}}' },
    });
  },
});
