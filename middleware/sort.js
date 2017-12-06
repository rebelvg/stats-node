const _ = require('lodash');

const allowedPaths = ['api.country', 'api.city', 'api.isp'];

function parseSort(model) {
    return function (req, res, next) {
        let sortSettings = {};

        let sortObj = {};

        if (_.isArray(req.query.sort)) {
            _.forEach(req.query.sort, (sort) => {
                _.forEach(_.concat(Object.keys(model.schema.paths), allowedPaths), (path) => {
                    switch (sort) {
                        case `-${path}`: {
                            sortObj[path] = -1;
                            break;
                        }
                        case path: {
                            sortObj[path] = 1;
                            break;
                        }
                    }
                });
            });
        }

        req.sortObj = sortObj;

        next();
    };
}

module.exports = parseSort;
