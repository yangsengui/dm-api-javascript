import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  DEFAULT_BUFFER_SIZE,
  DEFAULT_PIPE_TIMEOUT_MS,
  DEV_LICENSE_ERROR,
} from './constants.js';
import { ensureLibLoaded } from './ffi.js';
import { allocBuffer, parseJson, readCString } from './utils.js';

class DmApi {
  constructor({ dllPath = null, pipeTimeoutMs = DEFAULT_PIPE_TIMEOUT_MS } = {}) {
    this._funcs = ensureLibLoaded(dllPath);
    this._pipeTimeoutMs = Math.max(0, Math.floor(Number(pipeTimeoutMs) || 0));
  }

  static shouldSkipCheck({ appId = null, publicKey = null } = {}) {
    if (process.env.DM_PIPE && process.env.DM_API_PATH) {
      return false;
    }

    const resolvedAppId = appId || process.env.DM_APP_ID;
    const resolvedPublicKey = publicKey || process.env.DM_PUBLIC_KEY;
    if (!resolvedAppId || !resolvedPublicKey) {
      throw new Error(
        'App identity is required for dev-license checks. Provide appId/publicKey or set DM_APP_ID and DM_PUBLIC_KEY.'
      );
    }

    const pubkeyPath = path.join(
      os.homedir(),
      '.distromate-cli',
      'dev_licenses',
      String(resolvedAppId),
      'pubkey'
    );

    let devPubKey;
    try {
      devPubKey = fs.readFileSync(pubkeyPath, 'utf8').trim();
    } catch {
      throw new Error(DEV_LICENSE_ERROR);
    }

    if (!devPubKey || devPubKey !== String(resolvedPublicKey).trim()) {
      throw new Error(DEV_LICENSE_ERROR);
    }

    return true;
  }

  getVersion() {
    return this._funcs.getVersion() || '';
  }

  getLastError() {
    return this._funcs.getLastError() || null;
  }

  restartAppIfNecessary() {
    return this._funcs.restartAppIfNecessary() !== 0;
  }

  _resolvePipe() {
    return process.env.DM_PIPE || null;
  }

  _withPipe(callback) {
    const pipe = this._resolvePipe();
    if (!pipe) {
      return null;
    }

    if (this._funcs.connect(pipe, this._pipeTimeoutMs) !== 0) {
      return null;
    }

    try {
      return callback();
    } finally {
      this._funcs.close();
    }
  }

  _callStatusBool(func, ...args) {
    return func(...args) === 0;
  }

  _callU32Out(func) {
    const out = Buffer.alloc(4);
    if (func(out) !== 0) {
      return null;
    }
    return out.readUInt32LE(0);
  }

  _callStringOut(func, bufferSize = DEFAULT_BUFFER_SIZE) {
    const buffer = allocBuffer(bufferSize);
    if (func(buffer, buffer.length) !== 0) {
      return null;
    }
    return readCString(buffer);
  }

  setProductData(productData) {
    return this._callStatusBool(this._funcs.setProductData, productData);
  }

  setProductId(productId, flags = 0) {
    const normalizedFlags = Math.max(0, Math.floor(Number(flags) || 0));
    return this._callStatusBool(this._funcs.setProductId, productId, normalizedFlags);
  }

  setDataDirectory(directoryPath) {
    return this._callStatusBool(this._funcs.setDataDirectory, directoryPath);
  }

  setDebugMode(enable) {
    return this._callStatusBool(this._funcs.setDebugMode, enable ? 1 : 0);
  }

  setCustomDeviceFingerprint(fingerprint) {
    return this._callStatusBool(this._funcs.setCustomDeviceFingerprint, fingerprint);
  }

  setLicenseKey(licenseKey) {
    return this._callStatusBool(this._funcs.setLicenseKey, licenseKey);
  }

  setActivationMetadata(key, value) {
    return this._callStatusBool(this._funcs.setActivationMetadata, key, value);
  }

  activateLicense() {
    return this._callStatusBool(this._funcs.activateLicense);
  }

  activateLicenseOffline(filePath) {
    return this._callStatusBool(this._funcs.activateLicenseOffline, filePath);
  }

  generateOfflineDeactivationRequest(filePath) {
    return this._callStatusBool(this._funcs.generateOfflineDeactivationRequest, filePath);
  }

  getLastActivationError() {
    return this._callU32Out(this._funcs.getLastActivationError);
  }

  isLicenseGenuine() {
    return this._callStatusBool(this._funcs.isLicenseGenuine);
  }

  isLicenseValid() {
    return this._callStatusBool(this._funcs.isLicenseValid);
  }

  getServerSyncGracePeriodExpiryDate() {
    return this._callU32Out(this._funcs.getServerSyncGracePeriodExpiryDate);
  }

  getActivationMode(bufferSize = 64) {
    const initial = allocBuffer(bufferSize, 64);
    const current = allocBuffer(bufferSize, 64);
    const result = this._funcs.getActivationMode(initial, initial.length, current, current.length);
    if (result !== 0) {
      return null;
    }

    return {
      initial_mode: readCString(initial),
      current_mode: readCString(current),
    };
  }

  getLicenseKey(bufferSize = DEFAULT_BUFFER_SIZE) {
    return this._callStringOut(this._funcs.getLicenseKey, bufferSize);
  }

  getLicenseExpiryDate() {
    return this._callU32Out(this._funcs.getLicenseExpiryDate);
  }

  getLicenseCreationDate() {
    return this._callU32Out(this._funcs.getLicenseCreationDate);
  }

  getLicenseActivationDate() {
    return this._callU32Out(this._funcs.getLicenseActivationDate);
  }

  getActivationCreationDate() {
    return this._callU32Out(this._funcs.getActivationCreationDate);
  }

  getActivationLastSyncedDate() {
    return this._callU32Out(this._funcs.getActivationLastSyncedDate);
  }

  getActivationId(bufferSize = DEFAULT_BUFFER_SIZE) {
    return this._callStringOut(this._funcs.getActivationId, bufferSize);
  }

  getLibraryVersion(bufferSize = 32) {
    return this._callStringOut(this._funcs.getLibraryVersion, bufferSize);
  }

  reset() {
    return this._callStatusBool(this._funcs.reset);
  }

  checkForUpdates(options = {}) {
    const req = JSON.stringify(options || {});
    return this._withPipe(() => {
      const resp = parseJson(this._funcs.checkForUpdates(req));
      return resp?.data ?? null;
    });
  }

  downloadUpdate(options = {}) {
    const req = JSON.stringify(options || {});
    return this._withPipe(() => {
      const resp = parseJson(this._funcs.downloadUpdate(req));
      return resp?.data ?? null;
    });
  }

  getUpdateState() {
    return this._withPipe(() => {
      const resp = parseJson(this._funcs.getUpdateState());
      return resp?.data ?? null;
    });
  }

  waitForUpdateStateChange(lastSequence, timeoutMs = 30000) {
    const sequence = Math.max(0, Math.floor(Number(lastSequence) || 0));
    const timeout = Math.max(0, Math.floor(Number(timeoutMs) || 0));
    return this._withPipe(() => {
      const resp = parseJson(this._funcs.waitForUpdateStateChange(sequence, timeout));
      return resp?.data ?? null;
    });
  }

  quitAndInstall(options = {}) {
    const req = JSON.stringify(options || {});
    const result = this._withPipe(() => this._funcs.quitAndInstall(req) === 1);
    return result === true;
  }

  jsonToCanonical(jsonStr) {
    return this._funcs.jsonToCanonical(jsonStr) || null;
  }

  static jsonToCanonical(jsonStr, { dllPath = null } = {}) {
    const loaded = ensureLibLoaded(dllPath);
    return loaded.jsonToCanonical(jsonStr) || null;
  }
}

export { DmApi };
