# dm-api-javascript

JavaScript SDK for DistroMate `dm_api.dll`.

## Install

```bash
npm install distromate-dm-api-js
```

## Integration Flow

1. Initialization: `setProductData`, `setProductId`.
2. Activation: `setLicenseKey`, `activateLicense`.
3. Validation on startup: `isLicenseGenuine` or `isLicenseValid`.
4. Version/update: `getVersion`, `getLibraryVersion`, `checkForUpdates`.

## Quick Start

```javascript
import { DmApi } from 'distromate-dm-api-js';

const api = new DmApi();
api.setProductData('<product_data>');
api.setProductId('your-product-id', 0);
api.setLicenseKey('XXXX-XXXX-XXXX');

if (!api.activateLicense()) {
  throw new Error(api.getLastError() || 'activation failed');
}
```

## Release

- CI checks install and package generation.
- Tag `v*` triggers npm publish.
- Required secret: `NPM_TOKEN`.
