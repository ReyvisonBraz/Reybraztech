import { Response, NextFunction } from 'express';
import sql from '../database.js';
import { AuthRequest } from './auth.js';
import logger from '../utils/logger.js';

export const verifyAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.clientId) {
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        // Busca o status de admin do banco
        const [client] = await sql`
            SELECT is_admin FROM clients WHERE id = ${req.clientId}
        `;

        if (!client || !client.is_admin) {
            res.status(403).json({ error: 'Acesso restrito a administradores.' });
            return;
        }

        next();
    } catch (error) {
        logger.error('Erro na verificação de admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
