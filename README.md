# stats-node

## Overview
A statistics server/API for collecting data about streamers and viewers.
Supports Adobe Media Server, Node Media Server.
Cross platform support, runs on Win/Mac/Linux.

### Requirements
- Node.js >= 8
- Yarn
- MongoDB
- AMS or NMS installed locally
- Google Plus API access

### Links
- [Adobe Media Server](http://www.adobe.com/products/adobe-media-server-family.html)
- [Node Media Server](https://github.com/illuspas/Node-Media-Server)
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
