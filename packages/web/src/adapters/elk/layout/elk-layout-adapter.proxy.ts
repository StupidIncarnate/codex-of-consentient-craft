import ELK from 'elkjs';

import { z } from 'zod';

import { registerMock } from '@dungeonmaster/testing/register-mock';

// The child-id list the adapter hands to `elk.layout`, narrowed from the captured mock argument so
// tests can assert portal ids were added without reading `any` off the jest call record. The brand
// keeps this off the ban-raw-primitive rule; at runtime the ids are plain strings.
const elkGraphChildIdContract = z.string().min(1).brand<'ElkGraphChildId'>();
type ElkGraphChildId = z.infer<typeof elkGraphChildIdContract>;

const capturedGraphSchema = z.object({
  children: z.array(z.object({ id: elkGraphChildIdContract })).default([]),
});
// The layout call is `layout(graph)` — one positional arg. Parsing the whole args tuple lets the
// accessor destructure a typed graph instead of indexing `[0]` off the mock's `any` call record.
const capturedCallSchema = z.tuple([capturedGraphSchema]);

export const elkLayoutAdapterProxy = (): {
  returnsPositions: ({
    children,
  }: {
    children: readonly { id: string; x?: number; y?: number }[];
  }) => void;
  returnsNoChildren: () => void;
  throws: ({ error }: { error: Error }) => void;
  getGraphChildIds: () => readonly ElkGraphChildId[];
} => {
  const mockLayout = jest.fn();

  const mockInstance = { layout: mockLayout };

  const elkHandle = registerMock({ fn: ELK as never });
  elkHandle.mockReturnValue(mockInstance as never);

  return {
    returnsPositions: ({
      children,
    }: {
      children: readonly { id: string; x?: number; y?: number }[];
    }): void => {
      mockLayout.mockResolvedValueOnce({ id: 'root', children: [...children] });
    },
    returnsNoChildren: (): void => {
      mockLayout.mockResolvedValueOnce({ id: 'root' });
    },
    throws: ({ error }: { error: Error }): void => {
      mockLayout.mockRejectedValueOnce(error);
    },
    getGraphChildIds: (): readonly ElkGraphChildId[] => {
      const [graph] = capturedCallSchema.parse(mockLayout.mock.calls.at(-1));
      return graph.children.map((c) => c.id);
    },
  };
};
