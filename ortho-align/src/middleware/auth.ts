import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, AuthUser } from '../types';
import { UserRole, EmployeeType } from '@prisma/client';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

/** Attaches user when Bearer token is valid; continues without user if missing or invalid. */
export const authenticateOptional = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const token = authHeader.substring(7);
    req.user = jwt.verify(token, config.jwtSecret) as AuthUser;
  } catch {
    // Stateless logout: still return success; client clears token regardless.
  }
  next();
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      return;
    }

    next();
  };
};

/** Reject PATIENT role — use /api/patient/* routes instead. */
export const denyPatient = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === UserRole.PATIENT) {
    res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    return;
  }
  next();
};

export const authorizeEmployee = (...employeeTypes: EmployeeType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.user.role !== UserRole.EMPLOYEE) {
      res.status(403).json({ error: 'Forbidden - Must be an employee' });
      return;
    }

    if (!req.user.employeeType || !employeeTypes.includes(req.user.employeeType)) {
      res.status(403).json({ error: 'Forbidden - Insufficient employee permissions' });
      return;
    }

    next();
  };
};
