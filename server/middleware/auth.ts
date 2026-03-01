import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'reybraztech_secret_key_change_in_production';

export interface AuthRequest extends Request {
    clientId?: number;
    clientEmail?: string;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
        req.clientId = decoded.id;
        req.clientEmail = decoded.email;
        next();
    } catch {
        res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    }
};
