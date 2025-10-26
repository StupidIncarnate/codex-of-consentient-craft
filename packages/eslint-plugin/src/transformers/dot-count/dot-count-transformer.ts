import { depthCountContract } from '../../contracts/depth-count/depth-count-contract';
import type { DepthCount } from '../../contracts/depth-count/depth-count-contract';

export const dotCountTransformer = ({ str }: { str: string }): DepthCount => {
  const matches = str.match(/\./gu);
  const count = matches ? matches.length : 0;

  return depthCountContract.parse(count);
};
