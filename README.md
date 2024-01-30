# stats-node

## Overview

Statistics server/api for collecting data from various media servers about streams, streamers and stream viewers.

### App Features

- Servers Support
  - KLPQ Stream Service (based on node-media-server)
  - Adobe Media Server (with stats-node-ams)

### API Features

- Sorting
- Filtering
- Pagination
- Google Login

### Requirements

- Node.js LTS
- Yarn
- MongoDB
- Google Plus API access

### Dev Requirements

- Docker

### Links

- [KLPQ Stream Service](https://github.com/rebelvg/stream-service)
- [Adobe Media Server](http://www.adobe.com/products/adobe-media-server-family.html)
- [Stats Node AMS](https://github.com/rebelvg/stats-node-ams)
- [Google Plus API](https://console.developers.google.com/apis/library/plus.googleapis.com)

## Frontend Counterpart

> https://github.com/rebelvg/stats-react

## Usage

### Run

```
docker-compose up -d
yarn install
yarn start
```

### PM2 Support

```
yarn pm2:setup
yarn pm2
```

## Live Example

> http://stats.klpq.io/streams
