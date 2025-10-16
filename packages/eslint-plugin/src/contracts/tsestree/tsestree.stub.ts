import { tsestreeContract } from './tsestree-contract';
import type { Tsestree } from './tsestree-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const TsestreeStub = ({ ...props }: StubArgument<Tsestree> = {}): Tsestree => {
  // Separate parent (recursive property) from data props
  const { parent, ...dataProps } = props;

  // Return: validated data + parent (preserved reference)
  const validated = tsestreeContract.parse({
    type: 'Identifier',
    ...dataProps,
  });

  // Conditionally include parent based on whether it was provided
  if (parent !== undefined) {
    return {
      ...validated,
      parent: parent as Tsestree,
    };
  }

  return {
    ...validated,
    parent: null,
  };
};
