export class ErrorHandler extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

export class BadRequestError extends ErrorHandler {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

export class InternalServerError extends ErrorHandler {
  constructor() {
    super("Internal server error");
    this.statusCode = 500;
  }
}

export class RequestValidationError extends ErrorHandler {
  constructor() {
    super("Invalid request parameters");
    this.statusCode = 400;
  }
}

export class UnauthorizationError extends ErrorHandler {
  constructor() {
    super("Unauthorized");
    this.statusCode = 401;
  }
}

export class ForbiddenError extends ErrorHandler {
  constructor() {
    super("Forbidden");
    this.statusCode = 403;
  }
}

export class NotFoundError extends ErrorHandler {
  constructor() {
    super("Resource not found");
    this.statusCode = 404;
  }
}

export class TokenExpiredError extends ErrorHandler {
  constructor() {
    super("TokenExpired");
    this.statusCode = 401;
  }
}

export const handleError = async (err, res) => {
  const { statusCode, message } = err;
  res.status(statusCode).json({
    error: true,
    statusCode,
    message,
  });
};
