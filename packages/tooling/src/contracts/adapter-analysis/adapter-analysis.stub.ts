import { adapterAnalysisContract } from './adapter-analysis-contract';
import type { AdapterAnalysis } from './adapter-analysis-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OutsideCallStub } from '../outside-call/outside-call.stub';

export const AdapterAnalysisStub = ({
  ...props
}: StubArgument<AdapterAnalysis> = {}): AdapterAnalysis =>
  adapterAnalysisContract.parse({
    outsideCalls: [OutsideCallStub()],
    reasons: [],
    ...props,
  });
