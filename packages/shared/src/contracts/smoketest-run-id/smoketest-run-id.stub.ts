
export const SmoketestRunIdStub = ({ value }: { value?: ActiveSmoketestRun['runId'] } = {}): ActiveSmoketestRun['runId'] =>
  activeSmoketestRunContract.shape.runId.parse(value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
