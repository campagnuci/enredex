export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  badRequest: (message = "Bad request") => new AppError(400, message, "BAD_REQUEST"),
  unauthorized: (message = "Unauthorized") => new AppError(401, message, "UNAUTHORIZED"),
  forbidden: (message = "Forbidden") => new AppError(403, message, "FORBIDDEN"),
  notFound: (message = "Not found") => new AppError(404, message, "NOT_FOUND"),
  conflict: (message = "Conflict") => new AppError(409, message, "CONFLICT"),
};
