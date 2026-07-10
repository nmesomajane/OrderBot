

const { v4: uuidv4 } = require('uuid');

function deviceIdMiddleware(req, res, next) {
  let deviceId = req.header('X-Device-Id');

  if (!deviceId) {
    deviceId = uuidv4();
    
    res.setHeader('X-New-Device-Id', deviceId);
  }

  req.deviceId = deviceId;
  next();
}

module.exports = deviceIdMiddleware;