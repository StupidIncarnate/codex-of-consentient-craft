import { mswRequestIdContract, type MswRequestId } from './msw-request-id-contract';

export const MswRequestIdStub = ({ value }: { value?: string } = {}): MswRequestId =>
  mswRequestIdContract.parse(value ?? 'msw-req-001');
