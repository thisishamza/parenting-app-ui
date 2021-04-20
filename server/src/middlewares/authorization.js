const Errors = require("../errors/errorCodes");
const BaseError = require("../errors/BaseError");
const TokenService = require("../services/tokenService");
const apiResponseUtil = require('../helpers/api-response');

async function authMiddleware(req, res, next) {
  try {
    const unauthorized = {
      message: "Unauthorized",
      errorCode: Errors.UNAUTHORIZED,
    };

    let token = req.headers["authorization"];

    token = token ? token.replace("Bearer ", "") : null;

    if (!token) {
      return res
        .status(Errors.UNAUTHORIZED)
        .send(unauthorized);
    }

    const tokenService = new TokenService();
    const validToken = tokenService.verifyToken(token);

    if (validToken instanceof BaseError) {
      return res
        .status(Errors.UNAUTHORIZED)
        .send(unauthorized);
    }

    const { clientIdentity } = tokenService.decodeToken(token);

    res.locals.clientIdentity = clientIdentity;

    return next();
  } catch (err) {
    return apiResponseUtil.errorResponse(res, e)
  }
}

module.exports = authMiddleware;
