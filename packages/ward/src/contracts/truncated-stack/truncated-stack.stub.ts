import { truncatedStackContract, type TruncatedStack } from './truncated-stack-contract';

export const TruncatedStackStub = ({ value }: { value?: string } = {}): TruncatedStack =>
  truncatedStackContract.parse(
    value ?? 'at Object.<anonymous> (src/index.ts:10:5)\n  ... 5 more lines',
  );
