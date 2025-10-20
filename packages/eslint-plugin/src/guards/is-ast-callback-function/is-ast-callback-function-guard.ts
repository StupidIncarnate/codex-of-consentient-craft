import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstCallbackFunctionGuard = ({ funcNode }: { funcNode?: Tsestree }): boolean =>
  funcNode?.parent?.type === 'CallExpression';
