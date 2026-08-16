import { disciplineContract } from './discipline-contract';
import type { Discipline } from './discipline-contract';

export const DisciplineStub = ({ value }: { value?: Discipline } = {}): Discipline =>
  disciplineContract.parse(value ?? 'implementation');
