import { flowContract } from './flow-contract';
import { FlowStub } from './flow.stub';

describe('flowContract', () => {
  describe('valid flows', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const flow = FlowStub();

      expect(flow).toStrictEqual({
        id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        requirementIds: [],
        diagram: 'graph TD; A[Start] --> B[Login Page] --> C[Dashboard]',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });
    });

    it('VALID: {with requirementIds} => parses with requirement references', () => {
      const flow = FlowStub({
        requirementIds: [
          'b12ac10b-58cc-4372-a567-0e02b2c3d479',
          'a11ac10b-58cc-4372-a567-0e02b2c3d479',
        ],
      });

      expect(flow.requirementIds).toStrictEqual([
        'b12ac10b-58cc-4372-a567-0e02b2c3d479',
        'a11ac10b-58cc-4372-a567-0e02b2c3d479',
      ]);
    });

    it('VALID: {multiple exitPoints} => parses with multiple exits', () => {
      const flow = FlowStub({
        exitPoints: ['/dashboard', '/error', '/logout'],
      });

      expect(flow.exitPoints).toStrictEqual(['/dashboard', '/error', '/logout']);
    });

    it('VALID: {without requirementIds field} => backward compat defaults to empty array', () => {
      const result = flowContract.parse({
        id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        diagram: 'graph TD; A-->B',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });

      expect(result.requirementIds).toStrictEqual([]);
    });
  });

  describe('invalid flows', () => {
    it('INVALID_ID: {id: "bad"} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'bad',
          name: 'Login Flow',
          diagram: 'graph TD; A-->B',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: '',
          diagram: 'graph TD; A-->B',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_DIAGRAM: {diagram: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Login Flow',
          diagram: '',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_ENTRY_POINT: {entryPoint: ""} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Login Flow',
          diagram: 'graph TD; A-->B',
          entryPoint: '',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_REQUIREMENT_IDS: {requirementIds: ["bad"]} => throws validation error', () => {
      expect(() => {
        flowContract.parse({
          id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Login Flow',
          requirementIds: ['bad'],
          diagram: 'graph TD; A-->B',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
