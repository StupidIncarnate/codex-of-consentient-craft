import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';

import { createPackageResolveRequestBroker } from './create-package-resolve-request-broker';
import { createPackageResolveRequestBrokerProxy } from './create-package-resolve-request-broker.proxy';
import { CreatePackageArgsStub } from '../../../contracts/create-package-args/create-package-args.stub';

describe('createPackageResolveRequestBroker', () => {
  describe('non-interactive', () => {
    it('VALID: {name, packageType, description, packagesDir all flagged} => parses full request verbatim', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({
        name: 'widgets',
        packageType: 'http-backend',
        description: 'A widget package',
        packagesDir: 'custom-packages',
      });
      const scope = PathSegmentStub({ value: '@acme' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: false });

      expect(result).toStrictEqual({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'http-backend',
        description: 'A widget package',
        packagesDir: 'custom-packages',
      });
    });

    it('VALID: {name: "widgets", scope: "@acme"} => prefixes the scope and defaults the description', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ name: 'widgets' });
      const scope = PathSegmentStub({ value: '@acme' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: false });

      expect(result).toStrictEqual({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        description: 'widgets package',
        packagesDir: 'packages',
      });
    });

    it('VALID: {name: "@othername/widgets", scope: "@acme"} => does not double-prefix and takes directoryName after the slash', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ name: '@othername/widgets' });
      const scope = PathSegmentStub({ value: '@acme' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: false });

      expect(result).toStrictEqual({
        packageName: '@othername/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        description: 'widgets package',
        packagesDir: 'packages',
      });
    });

    it('VALID: {name: "widgets", scope: ""} => leaves the bare name unprefixed', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ name: 'widgets' });
      const scope = PathSegmentStub({ value: '' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: false });

      expect(result).toStrictEqual({
        packageName: 'widgets',
        directoryName: 'widgets',
        packageType: 'library',
        description: 'widgets package',
        packagesDir: 'packages',
      });
    });

    it('INVALID: {name: "@gateway/foo"} => refuses the @gateway scope and points at the session snippet', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ name: '@gateway/foo' });
      const scope = PathSegmentStub({ value: '@acme' });

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: false }),
      ).rejects.toThrow(
        /^create-package does not scaffold a package under the @gateway scope: a gateway wrapper is not a create-package-scaffolded package\. See the session snippet for adding an npm or bin gateway wrapper\.$/u,
      );
    });

    it('INVALID: {name: absent, interactive: false} => throws naming --name', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ name: undefined as never });
      const scope = PathSegmentStub({ value: '@acme' });

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: false }),
      ).rejects.toThrow(
        /^--name is required when running non-interactively; dungeonmaster create-package will not prompt for input\.$/u,
      );
    });

    it('INVALID: {packageType: absent, interactive: false} => throws naming --type', async () => {
      createPackageResolveRequestBrokerProxy();
      const args = CreatePackageArgsStub({ packageType: undefined as never });
      const scope = PathSegmentStub({ value: '' });

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: false }),
      ).rejects.toThrow(
        /^--type is required when running non-interactively; dungeonmaster create-package will not prompt for input\.$/u,
      );
    });
  });

  describe('interactive', () => {
    it('VALID: {name, packageType, description all absent} => resolves every prompt answer', async () => {
      const proxy = createPackageResolveRequestBrokerProxy();
      proxy.setupAnswers({
        name: 'widgets',
        packageType: 'http-backend',
        description: 'Custom description',
      });
      const args = CreatePackageArgsStub({
        name: undefined as never,
        packageType: undefined as never,
        description: undefined as never,
      });
      const scope = PathSegmentStub({ value: '@acme' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: true });

      expect(result).toStrictEqual({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'http-backend',
        description: 'Custom description',
        packagesDir: 'packages',
      });
      expect(proxy.getPromptsAsked()).toStrictEqual([
        'Package name: ',
        'Package type: ',
        'Description: ',
      ]);
    });

    it('EMPTY: {packageType answer: ""} => lands on the default packageType "library"', async () => {
      const proxy = createPackageResolveRequestBrokerProxy();
      proxy.setupAnswers({ packageType: '' });
      const args = CreatePackageArgsStub({
        name: 'widgets',
        packageType: undefined as never,
        description: 'A widget package',
      });
      const scope = PathSegmentStub({ value: '@acme' });

      const result = await createPackageResolveRequestBroker({ args, scope, interactive: true });

      expect(result).toStrictEqual({
        packageName: '@acme/widgets',
        directoryName: 'widgets',
        packageType: 'library',
        description: 'A widget package',
        packagesDir: 'packages',
      });
      expect(proxy.getPromptsAsked()).toStrictEqual(['Package type: ']);
    });

    it('INVALID: {name answer: "@gateway/foo"} => refuses the @gateway scope and points at the session snippet', async () => {
      const proxy = createPackageResolveRequestBrokerProxy();
      proxy.setupAnswers({ name: '@gateway/foo' });
      const args = CreatePackageArgsStub({ name: undefined as never, packageType: 'library' });
      const scope = PathSegmentStub({ value: '@acme' });

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: true }),
      ).rejects.toThrow(
        /^create-package does not scaffold a package under the @gateway scope: a gateway wrapper is not a create-package-scaffolded package\. See the session snippet for adding an npm or bin gateway wrapper\.$/u,
      );
      expect(proxy.getPromptsAsked()).toStrictEqual(['Package name: ']);
    });

    it('EMPTY: {name answer: ""} => throws because the name is still empty', async () => {
      const proxy = createPackageResolveRequestBrokerProxy();
      proxy.setupAnswers({ name: '' });
      const args = CreatePackageArgsStub({ name: undefined as never, packageType: 'library' });
      const scope = PathSegmentStub({ value: '@acme' });

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: true }),
      ).rejects.toThrow(/^Package name is required\.$/u);
      expect(proxy.getPromptsAsked()).toStrictEqual(['Package name: ']);
    });

    it('INVALID: {packageType answer: "not-a-real-type"} => throws listing every valid packageType', async () => {
      const proxy = createPackageResolveRequestBrokerProxy();
      proxy.setupAnswers({ packageType: 'not-a-real-type' });
      const args = CreatePackageArgsStub({
        name: 'widgets',
        packageType: undefined as never,
        description: 'A widget package',
      });
      const scope = PathSegmentStub({ value: '@acme' });
      const validTypes = packageBuildOrderStatics.tiers.flat().join(', ');

      await expect(
        createPackageResolveRequestBroker({ args, scope, interactive: true }),
      ).rejects.toThrow(
        new RegExp(
          `^Invalid package type "not-a-real-type"\\. Valid types: ${validTypes}\\.$`,
          'u',
        ),
      );
      expect(proxy.getPromptsAsked()).toStrictEqual(['Package type: ']);
    });
  });
});
