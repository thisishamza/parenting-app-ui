const BaseError = require("../errors/BaseError");
const ErrorCodes = require('../errors/errorCodes');

const apiResponseUtil = {
  jsonResponse(res, data) {
    return res.status(200).send({ data });
  },

  errorResponse(res, error) {
    if (error instanceof BaseError) {
      return res.status(error.status).send({ error: error.toString() });
    }
    console.log(error)
    return res
      .status(ErrorCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "Internal Server Error" });
  },
};

module.exports = apiResponseUtil;
