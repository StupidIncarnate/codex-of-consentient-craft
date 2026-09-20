import { resultFieldContract } from './result-field-contract';
import type { ResultField } from './result-field-contract';

export const ResultFieldStub = ({ value }: { value: string } = { value: 'status' }): ResultField =>
  resultFieldContract.parse(value);
