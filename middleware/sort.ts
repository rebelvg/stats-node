import * as _ from 'lodash';

const allowedPaths = ['api.country', 'api.city', 'api.isp'];

export function parseSort(model) {
  return function(req, res, next) {
    const sortObj = {};

    if (_.isArray(req.query.sort)) {
      _.forEach(req.query.sort, sort => {
        _.forEach(_.concat(_.keys(model.schema.paths), allowedPaths), path => {
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
