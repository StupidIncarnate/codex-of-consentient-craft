import { wardErrorListContract, type WardErrorList } from './ward-error-list-contract';

export const WardErrorListStub = ({ value }: { value?: string } = {}): WardErrorList =>
  wardErrorListContract.parse(value ?? 'src/index.ts\n  lint  no-unused-vars (line 10)');
