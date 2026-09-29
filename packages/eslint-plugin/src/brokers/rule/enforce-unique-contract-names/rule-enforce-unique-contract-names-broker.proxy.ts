import { ownerIndexBuildBrokerProxy } from '@dungeonmaster/shared/brokers/owner-index/build/owner-index-build-broker.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

const OBJECT_TEXT = [
  "import { z } from 'zod';",
  "export const thingContract = z.object({ id: z.string().brand<'ThingId'>() });",
  'export type Thing = z.infer<typeof thingContract>;',
  '',
].join('\n');

const SOLO_TEXT = [
  "import { z } from 'zod';",
  "export const soloContract = z.object({ id: z.string().brand<'SoloId'>() });",
  'export type Solo = z.infer<typeof soloContract>;',
  '',
].join('\n');

const SCALAR_TEXT = [
  "import { z } from 'zod';",
  "export const labelContract = z.string().brand<'Label'>();",
  'export type Label = z.infer<typeof labelContract>;',
  '',
].join('\n');

export const ruleEnforceUniqueContractNamesBrokerProxy = (): {
  setupProject: () => void;
} => {
  const buildProxy = ownerIndexBuildBrokerProxy();

  return {
    setupProject: (): void => {
      buildProxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: '/project/packages' }),
        folders: ['alpha', 'beta'],
      });
      for (const [name, folders] of [
        ['alpha', ['thing', 'solo', 'label']],
        ['beta', ['thing', 'label']],
      ] as const) {
        const packageDir = AbsoluteFilePathStub({ value: `/project/packages/${name}` });
        const srcDir = AbsoluteFilePathStub({ value: `${packageDir}/src` });
        const contractsDir = AbsoluteFilePathStub({ value: `${srcDir}/contracts` });
        buildProxy.setupPackageJson({ packageDir, json: `{"name":"@project/${name}"}` });
        buildProxy.setupWalkedFolder({ dirPath: packageDir, folders: ['src'], files: [] });
        buildProxy.setupWalkedFolder({ dirPath: srcDir, folders: ['contracts'], files: [] });
        buildProxy.setupWalkedFolder({ dirPath: contractsDir, folders, files: [] });
        for (const folder of folders) {
          buildProxy.setupWalkedFolder({
            dirPath: AbsoluteFilePathStub({ value: `${contractsDir}/${folder}` }),
            folders: [],
            files: [`${folder}-contract.ts`],
          });
          const texts = { thing: OBJECT_TEXT, solo: SOLO_TEXT, label: SCALAR_TEXT };
          buildProxy.setupSourceText({
            filePath: AbsoluteFilePathStub({
              value: `${contractsDir}/${folder}/${folder}-contract.ts`,
            }),
            text: texts[folder],
          });
        }
      }
    },
  };
};
