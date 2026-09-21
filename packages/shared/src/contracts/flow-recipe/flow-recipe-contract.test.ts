import { flowRecipeContract } from './flow-recipe-contract';
import { FlowRecipeStub } from './flow-recipe.stub';

describe('flowRecipeContract', () => {
  describe('valid recipes', () => {
    it('VALID: {id, instanceId, runId} => parses successfully', () => {
      const recipe = FlowRecipeStub();

      const result = flowRecipeContract.parse(recipe);

      expect(result).toStrictEqual({
        id: 'pc-walk-1',
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
      });
    });

    it('VALID: {a parsed FlowRecipe} => carries an id key, satisfying the merge-upsert precondition', () => {
      const recipe = FlowRecipeStub({ id: 'seed' });

      expect(recipe.id).toBe('seed');
    });
  });

  describe('invalid recipes', () => {
    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowRecipeContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {id: "Bad_Name"} => throws validation error', () => {
      expect(() => {
        flowRecipeContract.parse({
          id: 'Bad_Name',
          instanceId: 'inst_7f3a9c21',
          runId: 'run_2',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {instanceId: "not-an-instance-id"} => throws validation error', () => {
      expect(() => {
        flowRecipeContract.parse({
          id: 'pc-walk-1',
          instanceId: 'not-an-instance-id',
          runId: 'run_2',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {runId: "not-a-run-id"} => throws validation error', () => {
      expect(() => {
        flowRecipeContract.parse({
          id: 'pc-walk-1',
          instanceId: 'inst_7f3a9c21',
          runId: 'not-a-run-id',
        });
      }).toThrow(/invalid_string/u);
    });
  });
});
