import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questCrossSliceDagAutowireTransformer } from './quest-cross-slice-dag-autowire-transformer';

describe('questCrossSliceDagAutowireTransformer', () => {
  describe('cross-slice resolution via outputContracts', () => {
    it('VALID: {consumer uses producer name from another slice} => appends producer id to dependsOn', () => {
      const producer = DependencyStepStub({
        id: 'shared-make-thing' as never,
        slice: 'shared' as never,
        outputContracts: ['ThingContract' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never],
        dependsOn: [],
      });

      const [, wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producer, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual(['shared-make-thing']);
    });

    it('VALID: {consumer dependsOn already includes producer} => returns unchanged', () => {
      const producer = DependencyStepStub({
        id: 'shared-make-thing' as never,
        slice: 'shared' as never,
        outputContracts: ['ThingContract' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never],
        dependsOn: ['shared-make-thing' as never],
      });

      const [, wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producer, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual(['shared-make-thing']);
    });
  });

  describe('cross-slice resolution via exportName', () => {
    it('VALID: {consumer uses producer exportName from another slice} => wires dependsOn', () => {
      const producer = DependencyStepStub({
        id: 'shared-make-broker' as never,
        slice: 'shared' as never,
        exportName: 'thingFetchBroker' as never,
        outputContracts: ['Void' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-call-broker' as never,
        slice: 'web' as never,
        uses: ['thingFetchBroker' as never],
        dependsOn: [],
      });

      const [, wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producer, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual(['shared-make-broker']);
    });
  });

  describe('within-slice references are skipped', () => {
    it('VALID: {consumer uses sibling in same slice} => no auto-wire', () => {
      const producer = DependencyStepStub({
        id: 'web-make-thing' as never,
        slice: 'web' as never,
        outputContracts: ['ThingContract' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never],
        dependsOn: [],
      });

      const [, wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producer, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual([]);
    });
  });

  describe('ambiguous resolution', () => {
    it('EDGE: {two producers in different slices both match} => no auto-wire (pathseeker resolves)', () => {
      const producerA = DependencyStepStub({
        id: 'shared-make-thing' as never,
        slice: 'shared' as never,
        outputContracts: ['ThingContract' as never],
      });
      const producerB = DependencyStepStub({
        id: 'server-make-thing' as never,
        slice: 'server' as never,
        outputContracts: ['ThingContract' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never],
        dependsOn: [],
      });

      const [, , wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producerA, producerB, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual([]);
    });
  });

  describe('no match', () => {
    it('EDGE: {consumer uses unknown symbol} => no auto-wire', () => {
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['NonExistent' as never],
        dependsOn: [],
      });

      const [wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual([]);
    });
  });

  describe('mixed uses', () => {
    it('VALID: {consumer uses one resolved cross-slice + one unresolved} => wires only resolved', () => {
      const producer = DependencyStepStub({
        id: 'shared-make-thing' as never,
        slice: 'shared' as never,
        outputContracts: ['ThingContract' as never],
      });
      const consumer = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never, 'Mystery' as never],
        dependsOn: [],
      });

      const [, wiredConsumer] = questCrossSliceDagAutowireTransformer({
        steps: [producer, consumer],
      });

      expect(wiredConsumer!.dependsOn).toStrictEqual(['shared-make-thing']);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questCrossSliceDagAutowireTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questCrossSliceDagAutowireTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {consumer with no uses} => returns step unchanged', () => {
      const step = DependencyStepStub({
        id: 'web-thing' as never,
        slice: 'web' as never,
        uses: [],
        dependsOn: [],
      });

      const [result] = questCrossSliceDagAutowireTransformer({ steps: [step] });

      expect(result!.dependsOn).toStrictEqual([]);
    });
  });
});
