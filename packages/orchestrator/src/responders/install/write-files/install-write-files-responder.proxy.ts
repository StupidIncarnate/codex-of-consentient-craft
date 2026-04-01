import { InstallWriteFilesResponder } from './install-write-files-responder';

export const InstallWriteFilesResponderProxy = (): {
  callResponder: typeof InstallWriteFilesResponder;
} => ({
  callResponder: InstallWriteFilesResponder,
});
