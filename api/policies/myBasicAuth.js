'use strict';


/**
 * myBasicAuth
 *
 * If HTTP Basic Auth credentials are present in the headers, then authenticate the
 * user for a single request.
 */
module.exports = function (req, res, next) {
  if (!req.session.authenticated) {

    res.status(401)
    res.set('WWW-Authenticate', 'Basic realm="website"')
    return res.send('Forbidden');
  }
  return next()
};
