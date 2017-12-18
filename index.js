const express = require('express');
const mongoose = require('mongoose');
const {URL} = require('url');
const morgan = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const {db, stats} = require('./config.json');

const app = express();

if (process.env.NODE_ENV === 'dev') app.use(morgan('combined'));
app.use(session({
    secret: 'stats-node',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
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

app.use(function (req, res, next) {
    req.isAuthenticated();

    next();
});

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
    throw new Error('404');
});

app.use(function (err, req, res, next) {
    res.status(500).json({error: err.message});
});

app.listen(stats.port, () => {
    console.log('server is running.');
});
