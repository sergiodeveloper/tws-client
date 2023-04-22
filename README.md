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

### Installation

```bash
npm install @tws-js/server
```

### Example

Start the server:

```typescript
import { Operation, Schema, createServer } from '@tws-js/server';

const schema = new Schema({
  hello: new Operation({
    input: {
      name: {
        type: 'string',
        required: true,
        description: 'The name to greet',
      },
    },
    output: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The greeting message',
        },
      },
    },
    handler: ({ name }, metadata) => { // "name" automatically typed as string
      return {
        // Typescript will warn if "message" is not a string,
        // as required by the output
        message: `Hello ${name}`,
      };
    },
  }),
});

const server = createServer({
  schema,
  path: '/tws',
  logger: {
    error: (message) => console.error(message),
  },
  enablePlayground: true,
});

server.listen(3000);
```

Send a request to the server:

```bash
curl -X POST \
  http://localhost:3000/tws \
  -H "Content-Type: application/json" \
  -d '{ "operation": "hello", "input": { "name": "TWS" } }'
```

Check the response:

```json
{
  "data": {
    "message": "Hello TWS"
  }
}
```

## Collaborating

### Setup

```bash
nvm use 18
npm install
```

### Running

```bash
npm start
```

### Testing

```bash
npm run lint
npm test
```
