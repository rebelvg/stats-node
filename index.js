const express = require('express');
const mongoose = require('mongoose');
const {URL} = require('url');
const morgan = require('morgan');

const {db, stats} = require('./config.json');

const app = express();

if (process.env.NODE_ENV === 'dev') app.use(morgan('combined'));

mongoose.Promise = Promise;

let mongoUrl = new URL(`mongodb://${db.host}/${db.dbName}`);

if (db.authDb) {
    mongoUrl.username = encodeURIComponent(db.user);
    mongoUrl.password = encodeURIComponent(db.password);

    mongoUrl.searchParams.set('authSource', db.authDb);
}

mongoose.connect(mongoUrl.href, {useMongoClient: true}, function (error) {
    if (error) throw error;
});

global.liveStats = {};

require('./servers/amsUpdate');
require('./servers/nmsUpdate');

let channels = require('./routes/channels');
let streams = require('./routes/streams');
let subscribers = require('./routes/subscribers');

app.use('/channels', channels);
app.use('/streams', streams);
app.use('/subscribers', subscribers);

app.listen(stats.port, () => {
    console.log('server is running.');
});
