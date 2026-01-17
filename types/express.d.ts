declare namespace Express {
    export interface Request {
        user?: {
            id: string;
            email: string;
            [key: string]: any;
        };
        file?: any; // Multer file object
    }
}
