# TWS - Type-Safe Web Server Client

[![Test](https://github.com/sergiodeveloper/tws-client/actions/workflows/test.yml/badge.svg)](https://github.com/sergiodeveloper/tws-client/actions/workflows/test.yml)
[![NPM](https://img.shields.io/npm/v/@tws-js/client)](https://www.npmjs.com/package/@tws-js/client)

<p align="center">
  <img alt="TWS Logo" height="150" src="https://user-images.githubusercontent.com/7635171/232378489-e32588ea-e76b-4fd9-9cad-14bfb045e7b3.svg" />
  <br>
  <b>TWS Client is a tool to generate and consume types from a TWS server in your client code.</b>
</p>

✅ 100% code coverage

## Usage

Install the package:

```bash
npm install @tws-js/client
```

Generate the types passing the URL of a TWS server schema:

```bash
npx tws-types --server http://localhost:3000/tws/schema --output server-types.ts
```

Finally use the generated types in your client code:

```typescript
import { TwsClient } from '@tws-js/client';
import { TwsTypes } from './server-types';

const client = new TwsClient<TwsTypes>({
  // The URL of your TWS server. Also works with remote servers.
  url: 'http://localhost:3000/tws',
});

// Response and input types are automatically inferred
const response = await client.execute('myOperation', {
  name: 'TWS',
});
```

## Collaborating

### Setup

```bash
nvm use 18
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm run lint
npm test
```
