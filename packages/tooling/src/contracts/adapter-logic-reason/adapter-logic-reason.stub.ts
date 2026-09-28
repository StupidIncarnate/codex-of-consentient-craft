import { adapterLogicReasonContract } from './adapter-logic-reason-contract';
import type { AdapterLogicReason } from './adapter-logic-reason-contract';

export const AdapterLogicReasonStub = (
  {
    value,
  }: {
    value:
      | 'no-outside-call'
      | 'multiple-outside-calls'
      | 'no-gateway-export'
      | 'try-catch'
      | 'branching'
      | 'calls-adapter'
      | 'calls-repo-code'
      | 'calls-held-value'
      | 'method-on-held-value'
      | 'chained-call'
      | 'promise-construction';
  } = { value: 'try-catch' },
): AdapterLogicReason => adapterLogicReasonContract.parse(value);
