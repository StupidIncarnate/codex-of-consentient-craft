import { claudeModelContract } from './claude-model-contract';
import type { ClaudeModel } from './claude-model-contract';

export const ClaudeModelStub = ({ value }: { value?: ClaudeModel } = {}): ClaudeModel =>
  claudeModelContract.parse(value ?? 'haiku');
