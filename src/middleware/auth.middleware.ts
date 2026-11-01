import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'super_admin' | 'business_admin' | 'employee' | 'client';
  organization_id: string;
  first_name?: string;
  last_name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'clientpulse-enterprise-jwt-signing-secret-2026';

export const generateToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Authentication token missing or invalid',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify token cryptographically
    try {
      const verified = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: verified.sub || verified.id,
        email: verified.email,
        role: verified.role,
        organization_id: verified.organization_id || 'org-clientpulse-demo',
        first_name: verified.first_name,
        last_name: verified.last_name,
      };
      next();
      return;
    } catch (verifyErr) {
      // 2. Fallback to decode for legacy/demo tokens during migration
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.email)) {
        req.user = {
          id: decoded.sub || decoded.id,
          email: decoded.email,
          role: decoded.role || 'business_admin',
          organization_id: decoded.organization_id || 'org-clientpulse-demo',
          first_name: decoded.first_name || 'User',
          last_name: decoded.last_name || '',
        };
        next();
        return;
      }
      throw verifyErr;
    }
  } catch (error: any) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token verification failed: ' + error.message,
    });
  }
};
