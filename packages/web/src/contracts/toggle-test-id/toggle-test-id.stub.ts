import { toggleTestIdContract } from './toggle-test-id-contract';
import type { ToggleTestId } from './toggle-test-id-contract';

export const ToggleTestIdStub = ({
  value,
}: {
  value?: 'SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE' | 'CHAT_LIST_SHOW_EARLIER_TOGGLE';
} = {}): ToggleTestId => toggleTestIdContract.parse(value ?? 'SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');
