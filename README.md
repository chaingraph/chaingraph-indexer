# ChainGraph EOSIO Indexer

ChainGraph EOSIO Indexer

## Yarn

```
# Install nodemon typescript for dev
yarn --ignore-optional global add ts-node-dev typescript

# Install project dependencies
yarn install

# Development server with reload
yarn dev

```

## Docker

```
# Build the image
docker build -t chaingraph_eosio_indexer .

# Start a container
docker run -p 3000:3000 -d chaingraph_eosio_indexer

# Get container ID
docker ps

# Print app output
docker logs <container id>
```

## Contributing

Read the [contributing guidelines](https://docs.chaingraph.io/contributing) for details.
