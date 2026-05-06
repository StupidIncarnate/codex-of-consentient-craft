import { composeKillLayerBroker } from './compose-kill-layer-broker';
import { composeKillLayerBrokerProxy } from './compose-kill-layer-broker.proxy';

describe('composeKillLayerBroker', () => {
  describe('teardown sequence', () => {
    it('VALID: {tailStopMap empty} => calls spawnKill + handleStop and flips killedStateSet', () => {
      composeKillLayerBrokerProxy();
      const spawnKill = jest.fn();
      const handleStop = jest.fn();
      const tailStopMap = new Map<'stop', () => void>();
      const killedStateSet = new Set<'killed'>();

      const kill = composeKillLayerBroker({
        spawnKill,
        handleStop,
        tailStopMap,
        killedStateSet,
      });
      kill();

      expect(spawnKill).toHaveBeenCalledTimes(1);
      expect(handleStop).toHaveBeenCalledTimes(1);
      expect(tailStopMap.size).toBe(0);
      expect(killedStateSet.has('killed')).toBe(true);
    });

    it('VALID: {tailStopMap has stop} => calls spawnKill + handleStop + tail stop, clears map, flips killedStateSet', () => {
      composeKillLayerBrokerProxy();
      const spawnKill = jest.fn();
      const handleStop = jest.fn();
      const tailStop = jest.fn();
      const tailStopMap = new Map<'stop', () => void>();
      tailStopMap.set('stop', tailStop);
      const killedStateSet = new Set<'killed'>();

      const kill = composeKillLayerBroker({
        spawnKill,
        handleStop,
        tailStopMap,
        killedStateSet,
      });
      kill();

      expect(spawnKill).toHaveBeenCalledTimes(1);
      expect(handleStop).toHaveBeenCalledTimes(1);
      expect(tailStop).toHaveBeenCalledTimes(1);
      expect(tailStopMap.size).toBe(0);
      expect(killedStateSet.has('killed')).toBe(true);
    });
  });
});
