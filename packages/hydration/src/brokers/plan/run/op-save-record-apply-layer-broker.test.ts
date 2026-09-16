import { opSaveRecordApplyLayerBroker } from './op-save-record-apply-layer-broker';
import { opSaveRecordApplyLayerBrokerProxy } from './op-save-record-apply-layer-broker.proxy';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';

describe('opSaveRecordApplyLayerBroker', () => {
  it('VALID: {saveRecord on a created row} => the result carries the whole record', () => {
    opSaveRecordApplyLayerBrokerProxy();
    const state = HydrationRunStateStub({});
    state.records.set(RowRefStub({ value: 'guild[0:0]/quest[0:2]' }), {
      id: 'q1',
      title: 'The running one',
      status: 'in_progress',
    });
    const op = OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:2]', name: 'third' });

    opSaveRecordApplyLayerBroker({ op, state });

    expect(state.saved.get('third' as never)).toStrictEqual({
      id: 'q1',
      title: 'The running one',
      status: 'in_progress',
    });
  });

  it('VALID: {two saves of the same row under two names} => both keys hold that record', () => {
    opSaveRecordApplyLayerBrokerProxy();
    const state = HydrationRunStateStub({});
    state.records.set(RowRefStub({ value: 'guild[0:0]' }), { id: 'g1', name: 'Siege' });

    opSaveRecordApplyLayerBroker({
      op: OpSaveRecordStub({ ref: 'guild[0:0]', name: 'guild' }),
      state,
    });
    opSaveRecordApplyLayerBroker({
      op: OpSaveRecordStub({ ref: 'guild[0:0]', name: 'origin-guild' }),
      state,
    });

    expect(Object.fromEntries(state.saved)).toStrictEqual({
      guild: { id: 'g1', name: 'Siege' },
      'origin-guild': { id: 'g1', name: 'Siege' },
    });
  });
});
