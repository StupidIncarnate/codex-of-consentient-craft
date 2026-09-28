import type { RuleConfig } from './rule-config-contract';
import { ruleConfigContract } from './rule-config-contract';
import { messageContract } from '../message/message-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const RuleConfigStub = ({ ...props }: StubArgument<RuleConfig> = {}): RuleConfig => {
  const { message, ...dataProps } = props;
  // `message` is a union of a branded `Message` string and a function returning one —
  // StubArgument unbrands the string half (a raw literal is what a stub caller passes) but
  // preserves the function half whole, so only the string form needs re-parsing back to brand.
  const brandedMessage = typeof message === 'string' ? messageContract.parse(message) : message;

  return {
    ...ruleConfigContract.parse({
      rule: '@dungeonmaster/enforce-project-structure',
      displayName: 'Enforce Project Structure',
      ...dataProps,
    }),
    ...(brandedMessage === undefined ? {} : { message: brandedMessage }),
  };
};
