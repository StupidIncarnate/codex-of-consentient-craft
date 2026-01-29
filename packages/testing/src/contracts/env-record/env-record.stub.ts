import { envRecordContract, type EnvRecord } from './env-record-contract';

export const EnvRecordStub = (
  { value }: { value: Record<string, string | undefined> } = { value: {} },
): EnvRecord => envRecordContract.parse(value);
