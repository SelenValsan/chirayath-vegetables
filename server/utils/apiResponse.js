// Consistent API response helpers

const success = (res, data = {}, message = 'Success', statusCode = 200, meta = undefined) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const error = (res, message = 'Something went wrong', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

// Custom error class carrying an HTTP status code
class ApiError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = { success, error, ApiError };
