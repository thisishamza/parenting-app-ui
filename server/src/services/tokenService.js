const jwt = require("jsonwebtoken");
const BaseError = require("../errors/BaseError");
const ErrorCodes = require("../errors/errorCodes");

class TokenService {
  constructor(){
    this.EXPIRES_IN = process.env.JWT_EXPIRES_IN;
    this.JWT_SECRET = process.env.JWT_SECRET;
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (e) {
      return new BaseError('Invalid JWT token signature', ErrorCodes.BAD_REQUEST)
    }
  }

  encodeToken(tokenPayload) {
    return jwt.sign(tokenPayload, this.JWT_SECRET, {
      expiresIn: this.EXPIRES_IN,
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (err) {
      return new BaseError("Invalid JWT token", ErrorCodes.BAD_REQUEST);
    }
  }
}

module.exports = TokenService;
