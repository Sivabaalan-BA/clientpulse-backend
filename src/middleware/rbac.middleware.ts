import { Request, Response, NextFunction } from 'express';

type Role = 'super_admin' | 'business_admin' | 'employee' | 'client';

export const requireRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Forbidden: Access restricted. Role '${req.user.role}' lacks required permissions.`,
      });
      return;
    }

    next();
  };
};
