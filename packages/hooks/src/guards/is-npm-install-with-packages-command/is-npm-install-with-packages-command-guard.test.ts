import { npmInstallCommandStatics } from '../../statics/npm-install-command/npm-install-command-statics';
import { isNpmInstallWithPackagesCommandGuard } from './is-npm-install-with-packages-command-guard';

describe('isNpmInstallWithPackagesCommandGuard', () => {
  describe('every install alias npm accepts', () => {
    it.each(npmInstallCommandStatics.subcommands.map((alias) => `npm ${alias} left-pad`))(
      'VALID: {command: %s} => returns true',
      (command) => {
        expect(isNpmInstallWithPackagesCommandGuard({ command })).toBe(true);
      },
    );

    it.each(npmInstallCommandStatics.subcommands.map((alias) => `npm ${alias}`))(
      'EMPTY: {command: %s} => returns false (bare install, postinstall covers it)',
      (command) => {
        expect(isNpmInstallWithPackagesCommandGuard({ command })).toBe(false);
      },
    );
  });

  describe('installs that add a package', () => {
    it('VALID: {command: "npm install zod left-pad"} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install zod left-pad' })).toBe(
        true,
      );
    });

    it('VALID: {command: "npm install @scope/pkg@^1.2.0"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm install @scope/pkg@^1.2.0' }),
      ).toBe(true);
    });

    it('VALID: {command: "npm install -D left-pad"} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install -D left-pad' })).toBe(
        true,
      );
    });

    it('VALID: {command: "npm i --save-dev left-pad"} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm i --save-dev left-pad' })).toBe(
        true,
      );
    });

    it('VALID: {command: "npm install left-pad -w packages/web"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm install left-pad -w packages/web' }),
      ).toBe(true);
    });

    it('VALID: {command: "npm install --workspace=packages/web left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: 'npm install --workspace=packages/web left-pad',
        }),
      ).toBe(true);
    });

    it('VALID: {command: "npm -w packages/web install left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm -w packages/web install left-pad' }),
      ).toBe(true);
    });

    it('VALID: {command: "npm install \\"left-pad\\""} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install "left-pad"' })).toBe(
        true,
      );
    });

    it('VALID: {command: "/usr/local/bin/npm install left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: '/usr/local/bin/npm install left-pad' }),
      ).toBe(true);
    });

    it('VALID: {command: "CI=1 npm install left-pad"} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'CI=1 npm install left-pad' })).toBe(
        true,
      );
    });

    it('VALID: {command: "npm install left-pad 2>&1 | tail -5"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm install left-pad 2>&1 | tail -5' }),
      ).toBe(true);
    });

    it('VALID: {command: "npm install \\\\\\n  left-pad"} => returns true (line continuation)', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install \\\n  left-pad' })).toBe(
        true,
      );
    });
  });

  describe('install in a later segment of the line', () => {
    it('VALID: {command: "cd packages/web && npm install left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: 'cd packages/web && npm install left-pad',
        }),
      ).toBe(true);
    });

    it('VALID: {command: "npm run build; npm i left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm run build; npm i left-pad' }),
      ).toBe(true);
    });

    it('VALID: {command: "false || npm add left-pad"} => returns true', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'false || npm add left-pad' })).toBe(
        true,
      );
    });

    it('VALID: {command: "(cd packages/web && npm install left-pad)"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: '(cd packages/web && npm install left-pad)',
        }),
      ).toBe(true);
    });

    it('VALID: {command: "npm ci\\nnpm install left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm ci\nnpm install left-pad' }),
      ).toBe(true);
    });
  });

  describe('installs that add no package', () => {
    it('EMPTY: {command: "npm install -D"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install -D' })).toBe(false);
    });

    it('EMPTY: {command: "npm install -w packages/web"} => returns false (flag value is not a package)', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install -w packages/web' })).toBe(
        false,
      );
    });

    it('EMPTY: {command: "npm install --workspace packages/web --omit dev"} => returns false', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: 'npm install --workspace packages/web --omit dev',
        }),
      ).toBe(false);
    });

    it('EMPTY: {command: "npm install 2>&1 | tail -20"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install 2>&1 | tail -20' })).toBe(
        false,
      );
    });

    it('EMPTY: {command: "npm install > install.log"} => returns false (redirect target is not a package)', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install > install.log' })).toBe(
        false,
      );
    });

    it('EMPTY: {command: "npm install --ignore-scripts --no-audit --no-fund"} => returns false', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: 'npm install --ignore-scripts --no-audit --no-fund',
        }),
      ).toBe(false);
    });

    it('EMPTY: {command: "npm install &"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm install &' })).toBe(false);
    });
  });

  describe('installs that write no project dependency', () => {
    it.each(
      npmInstallCommandStatics.noDependencyFlags.map((flag) => `npm install ${flag} left-pad`),
    )('INVALID: {command: %s} => returns false', (command) => {
      expect(isNpmInstallWithPackagesCommandGuard({ command })).toBe(false);
    });

    it('INVALID: {command: "npm install --location global left-pad"} => returns false', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({ command: 'npm install --location global left-pad' }),
      ).toBe(false);
    });

    it('VALID: {command: "npm install --location project left-pad"} => returns true', () => {
      expect(
        isNpmInstallWithPackagesCommandGuard({
          command: 'npm install --location project left-pad',
        }),
      ).toBe(true);
    });
  });

  describe('other commands', () => {
    it('INVALID: {command: "ls -la"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'ls -la' })).toBe(false);
    });

    it('INVALID: {command: "npm ci"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm ci' })).toBe(false);
    });

    it('INVALID: {command: "npm run install left-pad"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm run install left-pad' })).toBe(
        false,
      );
    });

    it('INVALID: {command: "npm uninstall left-pad"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npm uninstall left-pad' })).toBe(
        false,
      );
    });

    it('INVALID: {command: "npx install left-pad"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'npx install left-pad' })).toBe(false);
    });

    it('INVALID: {command: "pnpm install left-pad"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'pnpm install left-pad' })).toBe(
        false,
      );
    });

    it('INVALID: {command: "echo npm install left-pad"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'echo npm install left-pad' })).toBe(
        false,
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {command: undefined} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({})).toBe(false);
    });

    it('EMPTY: {command: ""} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: '' })).toBe(false);
    });

    it('EMPTY: {command: "CI=1"} => returns false', () => {
      expect(isNpmInstallWithPackagesCommandGuard({ command: 'CI=1' })).toBe(false);
    });
  });
});
