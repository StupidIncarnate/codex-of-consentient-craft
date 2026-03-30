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

    const TestStub = ({ ...props }: StubArgument<TestType> = {}): TestType => {
      return {
        ...testContract.parse({ name: 'default', ...props }),
        onUpdate: props.onUpdate ?? ((_value: string): void => {}),
        getValue:
          props.getValue ??
          ((): string => {
            return 'default';
          }),
      };
    };

    it('VALID: {} => returns stub with default functions', () => {
      const result = TestStub();

      expect(result).toStrictEqual({
        name: 'default',
        onUpdate: expect.any(Function),
        getValue: expect.any(Function),
      });
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
      const customFn = (): string => {
        return 'custom';
      };
      const result = TestStub({ name: 'test-name', getValue: customFn });

      expect(result).toStrictEqual({
        name: 'test-name',
        onUpdate: expect.any(Function),
        getValue: customFn,
      });
      expect(result.getValue()).toBe('custom');
    });
  });

  describe('branded type unwrapping', () => {
    const userIdContract = z.string().uuid().brand<'UserId'>();
    type UserId = z.infer<typeof userIdContract>;

    const UserIdStub = (
      { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    ): UserId => {
      return userIdContract.parse(value);
    };

    it('VALID: {value: raw string} => accepts raw string and returns branded type', () => {
      const result = UserIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

      expect(result).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
    });
  });

  describe('Record types with branded keys', () => {
    const folderNameContract = z.string().brand<'FolderName'>();
    const packageNameContract = z.string().brand<'PackageName'>();

    const overridesContract = z.record(
      folderNameContract,
      z.object({ add: z.array(packageNameContract).optional() }),
    );

    const configContract = z.object({
      framework: z.string().brand<'Framework'>(),
      overrides: overridesContract.optional(),
    });

    type Config = z.infer<typeof configContract>;

    const ConfigStub = ({ ...props }: StubArgument<Config> = {}): Config => {
      return configContract.parse({
        framework: 'react',
        ...props,
      });
    };

    it('VALID: {overrides: {widgets: {add: ["react"]}}} => accepts plain string keys for branded Record keys', () => {
      const result = ConfigStub({
        overrides: {
          widgets: { add: ['react'] },
          bindings: { add: ['react-query'] },
        },
      });

      expect(result.overrides).toStrictEqual({
        widgets: { add: ['react'] },
        bindings: { add: ['react-query'] },
      });
    });

    it('VALID: {overrides: {}} => accepts empty overrides object', () => {
      const result = ConfigStub({
        overrides: {},
      });

      expect(result.overrides).toStrictEqual({});
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
        report:
          report ??
          ((..._args: unknown[]): unknown => {
            return true;
          }),
        getFilename:
          getFilename ??
          ((): string & z.BRAND<'Filename'> => {
            return filenameContract.parse('/test/file.ts');
          }),
      };
    };

    it('VALID: {} => returns stub with default data and functions', () => {
      const result = ContextStub();

      expect(result).toStrictEqual({
        filename: '/test/file.ts',
        report: expect.any(Function),
        getFilename: expect.any(Function),
      });
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
      const customGetFilename = (): string & z.BRAND<'Filename'> => {
        return filenameContract.parse('/custom/path.ts');
      };
      const result = ContextStub({
        filename: '/override/file.ts',
        getFilename: customGetFilename,
      });

      expect(result).toStrictEqual({
        filename: '/override/file.ts',
        report: expect.any(Function),
        getFilename: customGetFilename,
      });
      expect(result.getFilename?.()).toBe('/custom/path.ts');
    });
  });

  describe('edge cases: nested structures', () => {
    const userIdContract = z.string().uuid().brand<'UserId'>();
    const addressIdContract = z.string().brand<'AddressId'>();
    const cityNameContract = z.string().brand<'CityName'>();

    const addressContract = z.object({
      id: addressIdContract,
      city: cityNameContract,
    });

    const userContract = z.object({
      id: userIdContract,
      address: addressContract,
    });

    type User = z.infer<typeof userContract>;

    const UserStub = ({ ...props }: StubArgument<User> = {}): User => {
      return userContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        address: {
          id: 'addr-123',
          city: 'San Francisco',
        },
        ...props,
      });
    };

    it('VALID: Nested objects with branded types => accepts plain strings at all levels', () => {
      const result = UserStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        address: {
          id: 'addr-456',
          city: 'New York',
        },
      });

      expect(result).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        address: {
          id: 'addr-456',
          city: 'New York',
        },
      });
    });
  });

  describe('edge cases: arrays with branded types', () => {
    const tagContract = z.string().brand<'Tag'>();
    const tagsContract = z.array(tagContract);

    type Tags = z.infer<typeof tagsContract>;

    const TagsStub = (tags: StubArgument<Tags> = []): Tags => {
      return tagsContract.parse(tags);
    };

    it('VALID: Array of branded strings => accepts plain string array', () => {
      const result = TagsStub(['typescript', 'testing', 'zod']);

      expect(result).toStrictEqual(['typescript', 'testing', 'zod']);
    });
  });

  describe('edge cases: Records with branded values', () => {
    const userIdContract = z.string().uuid().brand<'UserId'>();
    const roleContract = z.string().brand<'Role'>();
    const userRolesContract = z.record(userIdContract, roleContract);

    type UserRoles = z.infer<typeof userRolesContract>;

    const UserRolesStub = ({ ...props }: StubArgument<UserRoles> = {}): UserRoles => {
      return userRolesContract.parse({
        'f47ac10b-58cc-4372-a567-0e02b2c3d479': 'admin',
        ...props,
      });
    };

    it('VALID: Record with branded keys AND values => accepts plain strings for both', () => {
      const result = UserRolesStub({
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d': 'editor',
        'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e': 'viewer',
      });

      expect(result).toStrictEqual({
        'f47ac10b-58cc-4372-a567-0e02b2c3d479': 'admin',
        'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d': 'editor',
        'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e': 'viewer',
      });
    });
  });

  describe('edge cases: union types with branded types', () => {
    const userIdContract = z.string().uuid().brand<'UserId'>();
    const optionalUserIdContract = userIdContract.optional();

    type OptionalUserId = z.infer<typeof optionalUserIdContract>;

    const OptionalUserIdStub = ({ value }: { value?: string } = {}): OptionalUserId => {
      return optionalUserIdContract.parse(value);
    };

    it('VALID: Optional branded type => accepts string or undefined', () => {
      const result1 = OptionalUserIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const result2 = OptionalUserIdStub();

      expect(result1).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
      expect(result2).toBe(undefined);
    });
  });

  describe('edge cases: readonly arrays with branded types', () => {
    const idContract = z.string().brand<'Id'>();
    const idsContract = z.array(idContract).readonly();

    type Ids = z.infer<typeof idsContract>;

    const IdsStub = (ids: StubArgument<Ids> = []): Ids => {
      return idsContract.parse(ids);
    };

    it('VALID: Readonly array of branded strings => accepts plain string array', () => {
      const result = IdsStub(['id-1', 'id-2', 'id-3']);

      expect(result).toStrictEqual(['id-1', 'id-2', 'id-3']);
    });
  });
});
