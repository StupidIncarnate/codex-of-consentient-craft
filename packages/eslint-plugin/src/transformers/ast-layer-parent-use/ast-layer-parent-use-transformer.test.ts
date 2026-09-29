import { astLayerParentUseTransformer } from './ast-layer-parent-use-transformer';

describe('astLayerParentUseTransformer', () => {
  describe('a layer used as a field', () => {
    it("VALID: {owner: ownerLayerContract} => returns ['questContract', 'owner']", () => {
      const source = `
import { ownerLayerContract } from './owner-layer-contract';
export const questContract = z.object({ owner: ownerLayerContract }).brand<'Quest'>();
`;

      const result = astLayerParentUseTransformer({ source, layerName: 'ownerLayerContract' });

      expect(result).toStrictEqual(['questContract', 'owner']);
    });

    it('VALID: {a layer inside .optional() and z.array()} => reads through the wrappers', () => {
      const source = `
import { itemLayerContract } from './item-layer-contract';
export const listContract = z.object({ items: z.array(itemLayerContract).optional() });
`;

      const result = astLayerParentUseTransformer({ source, layerName: 'itemLayerContract' });

      expect(result).toStrictEqual(['listContract', 'items']);
    });

    it('VALID: {a layer nested in an inline object} => adds each key on the way down', () => {
      const source = `
import { nameLayerContract } from './name-layer-contract';
export const questContract = z.object({ owner: z.object({ name: nameLayerContract }) });
`;

      const result = astLayerParentUseTransformer({ source, layerName: 'nameLayerContract' });

      expect(result).toStrictEqual(['questContract', 'owner', 'name']);
    });

    it('VALID: {a quoted key} => reads the literal text', () => {
      const source = `
import { ownerLayerContract } from './owner-layer-contract';
export const questContract = z.object({ 'quest-owner': ownerLayerContract });
`;

      const result = astLayerParentUseTransformer({ source, layerName: 'ownerLayerContract' });

      expect(result).toStrictEqual(['questContract', 'quest-owner']);
    });
  });

  describe('a layer that is not used as a field', () => {
    it('EMPTY: {the layer only in an import} => returns null', () => {
      const source = `import { ownerLayerContract } from './owner-layer-contract';`;

      const result = astLayerParentUseTransformer({ source, layerName: 'ownerLayerContract' });

      expect(result).toBe(null);
    });

    it('EMPTY: {source without the layer} => returns null', () => {
      const source = `export const questContract = z.object({ id: z.string() });`;

      const result = astLayerParentUseTransformer({ source, layerName: 'ownerLayerContract' });

      expect(result).toBe(null);
    });

    it('EDGE: {the layer used outside any const} => returns null', () => {
      const source = `run(ownerLayerContract);`;

      const result = astLayerParentUseTransformer({ source, layerName: 'ownerLayerContract' });

      expect(result).toBe(null);
    });
  });
});
