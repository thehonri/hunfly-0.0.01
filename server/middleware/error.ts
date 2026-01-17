import { Request, Response, NextFunction } from "express";
import { Logger } from "../logger";

export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    Logger.error(
        `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
