class BaseError extends Error{
    constructor(message, errorCode = 500) {
        super(message);
        this.name = 'BaseError';
        this.status = errorCode;
      }
}

module.exports = BaseError