import type { RuleConfig } from './rule-config-contract';
import { ruleConfigContract } from './rule-config-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const RuleConfigStub = ({ ...props }: StubArgument<RuleConfig> = {}): RuleConfig =>
  ruleConfigContract.parse({
    rule: '@questmaestro/enforce-project-structure',
    displayName: 'Enforce Project Structure',
    ...props,
  });
