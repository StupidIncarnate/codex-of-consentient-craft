import { OperationItemStub } from '@dungeonmaster/shared/contracts';

import { operationPtChainTransformer } from './operation-pt-chain-transformer';

describe('operationPtChainTransformer', () => {
  it('VALID: {original item, no continuations} => base is own text, chainLength 1', () => {
    const item = OperationItemStub({
      id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      role: 'flowrider',
      text: 'Flowrider: verify all flows',
    });

    const result = operationPtChainTransformer({ operations: [item], item });

    expect(result).toStrictEqual({ base: 'Flowrider: verify all flows', chainLength: 1 });
  });

  it('VALID: {pt 2 continuation with original on ledger} => base stripped, chainLength 2', () => {
    const original = OperationItemStub({
      id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      role: 'flowrider',
      text: 'Flowrider: verify all flows',
      status: 'complete',
    });
    const continuation = OperationItemStub({
      id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      role: 'flowrider',
      text: 'pt 2: Flowrider: verify all flows',
      status: 'in_progress',
    });

    const result = operationPtChainTransformer({
      operations: [original, continuation],
      item: continuation,
    });

    expect(result).toStrictEqual({ base: 'Flowrider: verify all flows', chainLength: 2 });
  });

  it('VALID: {same text, different role} => not counted in the chain', () => {
    const flowriderItem = OperationItemStub({
      id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      role: 'flowrider',
      text: 'verify all flows',
    });
    const siegeItem = OperationItemStub({
      id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      role: 'siegemaster',
      text: 'verify all flows',
    });

    const result = operationPtChainTransformer({
      operations: [flowriderItem, siegeItem],
      item: flowriderItem,
    });

    expect(result).toStrictEqual({ base: 'verify all flows', chainLength: 1 });
  });

  // The implementation fan-out names BOTH dimensions in a cell's text, and this is what that buys:
  // two cells of the SAME package on different flows are separate chains, so one flow's retries
  // never eat the other's budget. A text naming only the package would collapse them into one.
  it('VALID: {two codeweaver cells of one package on different flows} => each is its own chain of length 1', () => {
    const sendCell = OperationItemStub({
      id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      role: 'codeweaver',
      text: 'Codeweaver: build this slice — package: web · flow: send-message-with-images',
      status: 'complete',
      packageNames: ['web'],
      flowIds: ['send-message-with-images'],
    });
    const renderCell = OperationItemStub({
      id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      role: 'codeweaver',
      text: 'Codeweaver: build this slice — package: web · flow: render-images-in-transcript',
      status: 'pending',
      packageNames: ['web'],
      flowIds: ['render-images-in-transcript'],
    });

    expect({
      send: operationPtChainTransformer({
        operations: [sendCell, renderCell],
        item: sendCell,
      }),
      render: operationPtChainTransformer({
        operations: [sendCell, renderCell],
        item: renderCell,
      }),
    }).toStrictEqual({
      send: {
        base: 'Codeweaver: build this slice — package: web · flow: send-message-with-images',
        chainLength: 1,
      },
      render: {
        base: 'Codeweaver: build this slice — package: web · flow: render-images-in-transcript',
        chainLength: 1,
      },
    });
  });
});
