import { exportedNameContract } from './exported-name-contract';
import type { ExportedName } from './exported-name-contract';

export const ExportedNameStub = ({ value }: { value?: string } = {}): ExportedName =>
  exportedNameContract.parse(value ?? 'userFetchBroker');
