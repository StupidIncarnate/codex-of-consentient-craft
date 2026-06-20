import ELK from 'elkjs';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const elkLayoutAdapterProxy = (): {
  returnsPositions: ({
    children,
  }: {
    children: readonly { id: string; x: number; y: number }[];
  }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mockLayout = jest.fn();

  const mockInstance = { layout: mockLayout };

  const elkHandle = registerMock({ fn: ELK as never });
  elkHandle.mockReturnValue(mockInstance as never);

  return {
    returnsPositions: ({
      children,
    }: {
      children: readonly { id: string; x: number; y: number }[];
    }): void => {
      mockLayout.mockResolvedValueOnce({ id: 'root', children: [...children] });
    },
    throws: ({ error }: { error: Error }): void => {
      mockLayout.mockRejectedValueOnce(error);
    },
  };
};
