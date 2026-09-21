import { pieceIdContract } from './piece-id-contract';
import type { PieceId } from './piece-id-contract';

export const PieceIdStub = ({ value }: { value: string } = { value: 'pc-1' }): PieceId =>
  pieceIdContract.parse(value);
