const express = require('express');
const mongoose = require('mongoose');
const {URL} = require('url');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const fs = require('fs');
const cors = require('cors');

const {db, stats} = require('./config.json');

const app = express();

if (process.env.NODE_ENV === 'dev') app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.set('trust proxy', true);

require('./passport/init');

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

const readToken = require('./middleware/readToken');

app.use(cors());
app.use(readToken);

const channels = require('./routes/channels');
const streams = require('./routes/streams');
const subscribers = require('./routes/subscribers');
const ips = require('./routes/ips');
const users = require('./routes/users');
const admin = require('./routes/admin');

app.use('/channels', channels);
app.use('/streams', streams);
app.use('/subscribers', subscribers);
app.use('/ips', ips);
app.use('/users', users);
app.use('/admin', admin);

app.use(function (req, res, next) {
    throw new Error('Not found.');
});

app.use(function (err, req, res, next) {
    res.status(500).json({error: err.message});
});

//remove previous unix socket
if (typeof stats.port === 'string') {
    if (fs.existsSync(stats.port)) {
        fs.unlinkSync(stats.port);
    }
}

app.listen(stats.port, () => {
    console.log('server is running.');

    //set unix socket rw rights for nginx
    if (typeof stats.port === 'string') {
        fs.chmodSync(stats.port, '777');
    }
});
