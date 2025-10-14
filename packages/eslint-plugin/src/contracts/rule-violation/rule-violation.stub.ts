import { ruleViolationContract } from './rule-violation-contract';
import type { RuleViolation } from './rule-violation-contract';
import { astNodeContract } from '../ast-node/ast-node-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const RuleViolationStub = ({ ...props }: StubArgument<RuleViolation> = {}): RuleViolation =>
  ruleViolationContract.parse({
    node: astNodeContract.parse({
      type: 'Identifier',
      range: [0, 10],
      loc: {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 10 },
      },
    }),
    message: 'Violation message',
    ...props,
  });
