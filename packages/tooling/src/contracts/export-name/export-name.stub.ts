import { exportNameContract } from './export-name-contract';
import type { ExportName } from './export-name-contract';

export const ExportNameStub = ({ value }: { value: string } = { value: 'readFile' }): ExportName =>
  exportNameContract.parse(value);
