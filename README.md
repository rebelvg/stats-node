# stats-node

## Overview

Statistics server/API for collecting data from various media servers about streams, streamers and stream viewers.

### App Features

- Multiplatform (Win/Mac/Linux)
- Servers Support
  - Adobe Media Server (with stats-node-ams)
  - KLPQ Media Server (based on node-media-server)

### API Features

- Sorting
- Filtering
- Pagination
- Google Login

### Requirements

- Node.js >= 8
- Yarn
- MongoDB
- Google Plus API access

### Links

- [Adobe Media Server](http://www.adobe.com/products/adobe-media-server-family.html)
- [Stats Node AMS](https://github.com/rebelvg/stats-node-ams)
- [Node Media Server](https://github.com/rebelvg/klpq-nms)
- [Google Plus API](https://console.developers.google.com/apis/library/plus.googleapis.com)

## Frontend Counterpart

> https://github.com/rebelvg/stats-react

## Usage

### Run

```
yarn install
node .
```

### PM2 Support

```
pm2 start pm2.json
```

## Live Example

> http://stats.klpq.men/streams
