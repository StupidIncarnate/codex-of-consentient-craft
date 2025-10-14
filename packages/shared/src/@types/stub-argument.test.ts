import { z } from 'zod';
import type { StubArgument } from './stub-argument.type';

describe('StubArgument', () => {
  describe('function preservation', () => {
    const testContract = z.object({
      name: z.string().brand<'Name'>(),
    });
    type TestType = z.infer<typeof testContract> & {
      onUpdate: (value: string) => void;
      getValue: () => string;
    };

    const TestStub = ({ ...props }: StubArgument<TestType> = {}): TestType => ({
      ...testContract.parse({ name: 'default', ...props }),
      onUpdate: props.onUpdate ?? ((_value: string): void => {}),
      getValue: props.getValue ?? ((): string => 'default'),
    });

    it('VALID: {} => returns stub with default functions', () => {
      const result = TestStub();

      expect(typeof result.onUpdate).toBe('function');
      expect(typeof result.getValue).toBe('function');
      expect(result.getValue()).toBe('default');
    });

    it('VALID: {onUpdate: customFn} => preserves custom function reference', () => {
      const customFn = jest.fn();
      const result = TestStub({ onUpdate: customFn });

      result.onUpdate('test');

      expect(result.onUpdate).toBe(customFn);
      expect(customFn).toHaveBeenCalledWith('test');
      expect(customFn).toHaveBeenCalledTimes(1);
    });

    it('VALID: {getValue: customFn} => preserves custom function reference', () => {
      const customFn = jest.fn().mockReturnValue('custom');
      const result = TestStub({ getValue: customFn });

      const value = result.getValue();

      expect(result.getValue).toBe(customFn);
      expect(value).toBe('custom');
      expect(customFn).toHaveBeenCalledTimes(1);
    });

    it('VALID: {name: raw string, getValue: fn} => unwraps branded type and preserves function', () => {
      const customFn = (): string => 'custom';
      const result = TestStub({ name: 'test-name', getValue: customFn });

      expect(result.name).toBe('test-name');
      expect(result.getValue).toBe(customFn);
      expect(result.getValue()).toBe('custom');
    });
  });

  describe('branded type unwrapping', () => {
    const userIdContract = z.string().uuid().brand<'UserId'>();
    type UserId = z.infer<typeof userIdContract>;

    const UserIdStub = ({ value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }): UserId =>
      userIdContract.parse(value);

    it('VALID: {value: raw string} => accepts raw string and returns branded type', () => {
      const result = UserIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

      expect(result).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
    });
  });

  describe('complex objects with mixed types', () => {
    const contextContract = z.object({
      filename: z.string().brand<'Filename'>().optional(),
    });

    type Context = z.infer<typeof contextContract> & {
      report: (...args: unknown[]) => unknown;
      getFilename?: () => string & z.BRAND<'Filename'>;
    };

    const filenameContract = z.string().brand<'Filename'>();

    const ContextStub = ({ ...props }: StubArgument<Context> = {}): Context => {
      const { report, getFilename, ...dataProps } = props;

      return {
        ...contextContract.parse({
          filename: filenameContract.parse('/test/file.ts'),
          ...dataProps,
        }),
        report: report ?? ((..._args: unknown[]): unknown => true),
        getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> => filenameContract.parse('/test/file.ts')),
      };
    };

    it('VALID: {} => returns stub with default data and functions', () => {
      const result = ContextStub();

      expect(result.filename).toBe('/test/file.ts');
      expect(typeof result.report).toBe('function');
      expect(typeof result.getFilename).toBe('function');
      expect(result.report()).toBe(true);
      expect(result.getFilename?.()).toBe('/test/file.ts');
    });

    it('VALID: {report: customFn} => preserves custom report function', () => {
      const customReport = jest.fn().mockReturnValue('custom');
      const result = ContextStub({ report: customReport });

      const returnValue = result.report('arg1', 'arg2');

      expect(result.report).toBe(customReport);
      expect(returnValue).toBe('custom');
      expect(customReport).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('VALID: {filename: raw string, getFilename: fn} => accepts raw string for branded field and custom function', () => {
      const customGetFilename = (): string & z.BRAND<'Filename'> => filenameContract.parse('/custom/path.ts');
      const result = ContextStub({
        filename: '/override/file.ts',
        getFilename: customGetFilename,
      });

      expect(result.filename).toBe('/override/file.ts');
      expect(result.getFilename).toBe(customGetFilename);
      expect(result.getFilename?.()).toBe('/custom/path.ts');
    });
  });
});
