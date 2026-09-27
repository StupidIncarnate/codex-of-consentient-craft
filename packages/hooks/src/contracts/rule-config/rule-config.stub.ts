import type { RuleConfig } from './rule-config-contract';
import { ruleConfigContract } from './rule-config-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const RuleConfigStub = ({ ...props }: StubArgument<RuleConfig> = {}): RuleConfig => {
  const { message, ...dataProps } = props;

  return {
    ...ruleConfigContract.parse({
      rule: '@dungeonmaster/enforce-project-structure',
      displayName: 'Enforce Project Structure',
      ...dataProps,
    }),
    ...(message === undefined ? {} : { message }),
  };
};
