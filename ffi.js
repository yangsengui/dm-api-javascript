import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import koffi from 'koffi';

import { DEFAULT_DLL_NAME } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lib = null;
let funcs = null;

function resolveDllPath(dllPath = null) {
  let resolved = dllPath || process.env.DM_API_PATH || DEFAULT_DLL_NAME;
  if (path.isAbsolute(resolved)) {
    return resolved;
  }

  const candidates = [
    path.join(__dirname, resolved),
    path.join(path.dirname(__dirname), resolved),
  ];
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return existing || candidates[0];
}

export function ensureLibLoaded(dllPath = null) {
  if (!lib) {
    lib = koffi.load(resolveDllPath(dllPath));
    funcs = {
      connect: lib.func('DM_Connect', 'int32', ['str', 'uint32']),
      close: lib.func('DM_Close', 'int32', []),
      getVersion: lib.func('DM_GetVersion', 'str', []),
      getLastError: lib.func('DM_GetLastError', 'str', []),
      restartAppIfNecessary: lib.func('DM_RestartAppIfNecessary', 'int32', []),
      checkForUpdates: lib.func('DM_CheckForUpdates', 'str', ['str']),
      downloadUpdate: lib.func('DM_DownloadUpdate', 'str', ['str']),
      getUpdateState: lib.func('DM_GetUpdateState', 'str', []),
      waitForUpdateStateChange: lib.func('DM_WaitForUpdateStateChange', 'str', ['uint64', 'uint32']),
      quitAndInstall: lib.func('DM_QuitAndInstall', 'int32', ['str']),
      jsonToCanonical: lib.func('DM_JsonToCanonical', 'str', ['str']),

      setProductData: lib.func('SetProductData', 'int32', ['str']),
      setProductId: lib.func('SetProductId', 'int32', ['str', 'uint32']),
      setDataDirectory: lib.func('SetDataDirectory', 'int32', ['str']),
      setDebugMode: lib.func('SetDebugMode', 'int32', ['uint32']),
      setCustomDeviceFingerprint: lib.func('SetCustomDeviceFingerprint', 'int32', ['str']),

      setLicenseKey: lib.func('SetLicenseKey', 'int32', ['str']),
      setActivationMetadata: lib.func('SetActivationMetadata', 'int32', ['str', 'str']),
      activateLicense: lib.func('ActivateLicense', 'int32', []),
      activateLicenseOffline: lib.func('ActivateLicenseOffline', 'int32', ['str']),
      generateOfflineDeactivationRequest: lib.func(
        'GenerateOfflineDeactivationRequest',
        'int32',
        ['str']
      ),
      getLastActivationError: lib.func('GetLastActivationError', 'int32', ['pointer']),

      isLicenseGenuine: lib.func('IsLicenseGenuine', 'int32', []),
      isLicenseValid: lib.func('IsLicenseValid', 'int32', []),
      getServerSyncGracePeriodExpiryDate: lib.func(
        'GetServerSyncGracePeriodExpiryDate',
        'int32',
        ['pointer']
      ),
      getActivationMode: lib.func('GetActivationMode', 'int32', ['pointer', 'uint32', 'pointer', 'uint32']),

      getLicenseKey: lib.func('GetLicenseKey', 'int32', ['pointer', 'uint32']),
      getLicenseExpiryDate: lib.func('GetLicenseExpiryDate', 'int32', ['pointer']),
      getLicenseCreationDate: lib.func('GetLicenseCreationDate', 'int32', ['pointer']),
      getLicenseActivationDate: lib.func('GetLicenseActivationDate', 'int32', ['pointer']),
      getActivationCreationDate: lib.func('GetActivationCreationDate', 'int32', ['pointer']),
      getActivationLastSyncedDate: lib.func('GetActivationLastSyncedDate', 'int32', ['pointer']),
      getActivationId: lib.func('GetActivationId', 'int32', ['pointer', 'uint32']),

      getLibraryVersion: lib.func('GetLibraryVersion', 'int32', ['pointer', 'uint32']),
      reset: lib.func('Reset', 'int32', []),
    };
  }

  return funcs;
}
