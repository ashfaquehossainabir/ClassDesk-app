export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export function sendResponse(res, statusCode, data, message) {
  const body = new ApiResponse(statusCode, data, message);
  return res.status(statusCode).json({
    success: body.success,
    message: body.message,
    data: body.data,
    errors: [],
  });
}
