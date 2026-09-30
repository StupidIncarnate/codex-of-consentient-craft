import { npmInstallCommandStatics } from './npm-install-command-statics';

describe('npmInstallCommandStatics', () => {
  it('VALID: exported value => matches the npm install vocabulary', () => {
    expect(npmInstallCommandStatics).toStrictEqual({
      program: {
        name: 'npm',
      },
      subcommands: [
        'install',
        'add',
        'i',
        'in',
        'ins',
        'inst',
        'insta',
        'instal',
        'isnt',
        'isnta',
        'isntal',
        'isntall',
      ],
      valueFlags: [
        '-w',
        '--workspace',
        '-C',
        '--prefix',
        '--registry',
        '--tag',
        '--cache',
        '--userconfig',
        '--globalconfig',
        '--omit',
        '--include',
        '--install-strategy',
        '--save-prefix',
        '--before',
        '--loglevel',
        '--location',
        '--otp',
        '--scope',
        '--cpu',
        '--os',
        '--libc',
      ],
      noDependencyFlags: ['-g', '--global', '--location=global', '--no-save', '--dry-run'],
    });
  });
});
