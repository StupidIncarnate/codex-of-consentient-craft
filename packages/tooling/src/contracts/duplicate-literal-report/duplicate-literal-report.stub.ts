import { duplicateLiteralReportContract } from './duplicate-literal-report-contract';
import type { DuplicateLiteralReport } from './duplicate-literal-report-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { LiteralValueStub } from '../literal-value/literal-value.stub';
import { LiteralTypeStub } from '../literal-type/literal-type.stub';
import { LiteralOccurrenceStub } from '../literal-occurrence/literal-occurrence.stub';

export const DuplicateLiteralReportStub = ({
  ...props
}: StubArgument<DuplicateLiteralReport> = {}): DuplicateLiteralReport =>
  duplicateLiteralReportContract.parse({
    value: LiteralValueStub(),
    type: LiteralTypeStub(),
    occurrences: [LiteralOccurrenceStub(), LiteralOccurrenceStub({ line: 10 })],
    count: 2,
    ...props,
  });
