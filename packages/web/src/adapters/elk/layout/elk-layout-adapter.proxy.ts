import ELK from 'elkjs';

import { z } from 'zod';

import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

// The child-id list the adapter hands to `elk.layout`, narrowed from the captured mock argument so
// tests can assert portal ids were added without reading `any` off the jest call record. The brand
// keeps this off the ban-raw-primitive rule; at runtime the ids are plain strings.
const elkGraphChildIdContract = z.string().min(1).brand<'ElkGraphChildId'>();
type ElkGraphChildId = z.infer<typeof elkGraphChildIdContract>;

// The reserved rectangle the adapter asks ELK to lay each child out inside. Branded so the
// accessor below hands back a typed box rather than raw numbers; at runtime these are plain px.
const elkGraphChildBoxSchema = z.object({
  id: elkGraphChildIdContract,
  width: z.number().brand<'ElkGraphChildWidth'>(),
  height: z.number().brand<'ElkGraphChildHeight'>(),
});
type ElkGraphChildBox = z.infer<typeof elkGraphChildBoxSchema>;

const capturedGraphSchema = z.object({
  children: z.array(z.object({ id: elkGraphChildIdContract })).default([]),
});
const capturedBoxGraphSchema = z.object({
  children: z.array(elkGraphChildBoxSchema).default([]),
});
// The layout call is `layout(graph)` — one positional arg. Parsing the whole args tuple lets the
// accessor destructure a typed graph instead of indexing `[0]` off the mock's `any` call record.
const capturedCallSchema = z.tuple([capturedGraphSchema]);
const capturedBoxCallSchema = z.tuple([capturedBoxGraphSchema]);

export const elkLayoutAdapterProxy = (): {
  returnsPositions: ({
    children,
    edges,
  }: {
    children: readonly { id: string; x?: number; y?: number }[];
    edges?: readonly {
      id: string;
      sections: readonly {
        startPoint: { x: number; y: number };
        bendPoints?: readonly { x: number; y: number }[];
        endPoint: { x: number; y: number };
      }[];
    }[];
  }) => void;
  returnsNoChildren: () => void;
  throws: ({ error }: { error: Error }) => void;
  getGraphChildIds: () => readonly (readonly ElkGraphChildId[])[];
  getGraphChildBoxes: () => readonly (readonly ElkGraphChildBox[])[];
} => {
  const mockLayout = jest.fn();
  const layoutHandle: MockHandle = registerMock({ fn: mockLayout });

  const mockInstance = { layout: mockLayout };

  const elkHandle: MockHandle = registerMock({ fn: ELK as never });
  // ELK is always constructed with zero arguments (`new ELK()`) — there is no call shape beyond
  // that to key on.
  elkHandle.calledWith([]).returns(mockInstance as never);

  return {
    returnsPositions: ({
      children,
      edges = [],
    }: {
      children: readonly { id: string; x?: number; y?: number }[];
      edges?: readonly {
        id: string;
        sections: readonly {
          startPoint: { x: number; y: number };
          bendPoints?: readonly { x: number; y: number }[];
          endPoint: { x: number; y: number };
        }[];
      }[];
    }): void => {
      // The graph elk.layout receives is assembled inside elkLayoutAdapter from label-length
      // derived card heights and static layoutOptions this proxy has no way to predict ahead of
      // the call — there's no real address beyond "the next layout call."
      layoutHandle.onceFor([]).resolves({ id: 'root', children: [...children], edges: [...edges] });
    },
    returnsNoChildren: (): void => {
      layoutHandle.onceFor([]).resolves({ id: 'root' });
    },
    throws: ({ error }: { error: Error }): void => {
      layoutHandle.onceFor([]).rejects(error);
    },
    // No real address exists (the graph argument is assembled from label-length card-height math
    // this proxy can't predict). `.map()` walks the COMPLETE call history into child-id lists
    // first — every recorded call is parsed, not just an unaddressed tail peek — so the returned
    // list-of-lists is a whole-history read a caller can index or assert on directly.
    getGraphChildIds: (): readonly (readonly ElkGraphChildId[])[] =>
      layoutHandle.callsMatching([]).map((call) => {
        const [graph] = capturedCallSchema.parse(call);
        return graph.children.map((c) => c.id);
      }),
    // The RESERVED rectangle per child, which is the only thing standing between a taller card and
    // the row beneath it: ELK lays out non-overlapping boxes, so a card that renders taller than
    // the box asked for here overlaps its neighbour and no unit test of the card alone can see it.
    getGraphChildBoxes: (): readonly (readonly ElkGraphChildBox[])[] =>
      layoutHandle.callsMatching([]).map((call) => {
        const [graph] = capturedBoxCallSchema.parse(call);
        return graph.children;
      }),
  };
};
