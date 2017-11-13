const _ = require('lodash');

function parseSort(model) {
    return function (req, res, next) {
        let sortSettings = {};

        let sortObj = {};

        if (req.query.sort && typeof req.query.sort === 'object') {
            _.forEach(req.query.sort, (sort) => {
                _.forEach(model.schema.paths, (value, key) => {
                    switch (sort) {
                        case `-${key}`: {
                            sortObj[key] = -1;
                            break;
                        }
                        case `${key}`: {
                            sortObj[key] = 1;
                            break;
                        }
                    }
                });
            });
        }

        if (Object.keys(sortObj).length === 0) {
            sortObj = {connectCreated: -1};
        }

        req.sortObj = sortObj;

        next();
    };
}

module.exports = parseSort;
