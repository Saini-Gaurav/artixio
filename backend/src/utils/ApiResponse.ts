import { Response } from "express";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Meta) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
