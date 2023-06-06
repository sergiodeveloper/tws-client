# Automatic typing of the client code

TWS Client can generate types from the server schema. This allows you to use the generated types in your client code, so you are able to get type safety and autocompletion during development.

```sh
cd examples/typing
npm install
npm run server
```

Then on another terminal:

```sh
cd examples/typing
npm run client
```

Experiment with this example by modifying `server.ts` and stopping and running `npm run server`.
Then run the following command to update the types on the client:

```sh
cd examples/typing
npm run types
```

Check the file `client.ts` to see the new types having effect on the code.

Then run the client:

```sh
cd examples/typing
npm run client
```
