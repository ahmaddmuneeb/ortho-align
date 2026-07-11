import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import { UserRole, EmployeeType, Gender } from '@prisma/client';
import { validatePassword, validateEmail, validatePhone } from '../lib/validation';
import { authenticateOptional } from '../middleware/auth';
import { EmailService } from '../services/email.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashResetToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new CLIENT user
 *     description: |
 *       Create a new CLIENT account with comprehensive validation.
 *       
 *       **Note:** Only CLIENT users can self-register. EMPLOYEE accounts must be created by ADMIN.
 *       
 *       **Password Requirements:**
 *       - Minimum 8 characters
 *       - At least one uppercase letter (A-Z)
 *       - At least one number (0-9)
 *       - At least one special character (!@#$%^&*)
 *       
 *       **CLIENT Role Requirements:**
 *       In addition to basic fields (email, password, name), CLIENT users must provide:
 *       - gender
 *       - region
 *       - phone
 *       - businessAddress
 *       - hearAboutUs
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *                 description: Valid email address (unique)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *                 description: Must contain 8+ chars, uppercase, number, and special char (!@#$%^&*)
 *               name:
 *                 type: string
 *                 example: Dr. John Smith
 *                 description: Full name of the user
 *               role:
 *                 type: string
 *                 enum: [CLIENT]
 *                 example: CLIENT
 *                 description: Only CLIENT role can self-register
 *               employeeType:
 *                 type: string
 *                 enum: [DESIGNER, QC, BOTH]
 *                 description: Not applicable for CLIENT registration (EMPLOYEE accounts created by ADMIN)
 *                 example: null
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 description: Required for CLIENT role
 *                 example: MALE
 *               region:
 *                 type: string
 *                 description: Required for CLIENT role
 *                 example: North America
 *               phone:
 *                 type: string
 *                 description: Required for CLIENT role (10+ characters)
 *                 example: +1-555-123-4567
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Optional - Business website
 *                 example: https://example-dental.com
 *               businessAddress:
 *                 type: string
 *                 description: Required for CLIENT role
 *                 example: 123 Dental Ave, City, ST 12345
 *               hearAboutUs:
 *                 type: string
 *                 description: Required for CLIENT role - How did you hear about us?
 *                 example: Google Search
 *           examples:
 *             clientRegistration:
 *               summary: Register a CLIENT user
 *               value:
 *                 email: client@example.com
 *                 password: SecurePass123!
 *                 name: Dr. John Smith
 *                 role: CLIENT
 *                 gender: MALE
 *                 region: North America
 *                 phone: +1-555-123-4567
 *                 website: https://dental-practice.com
 *                 businessAddress: 123 Dental Ave, Springfield, IL 62701
 *                 hearAboutUs: Google Search
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: Missing required fields for CLIENT registration
 *                     required:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["gender", "region", "phone", "businessAddress", "hearAboutUs"]
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: Password does not meet requirements
 *                     details:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Password must be at least 8 characters long", "Password must contain at least one special character (!@#$%^&*)"]
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      name, 
      role, 
      employeeType,
      gender,
      region,
      phone,
      website,
      businessAddress,
      hearAboutUs
    } = req.body;

    // Basic required fields
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Missing required fields: email, password, name, role' });
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
      return;
    }

    // Role validation — only CLIENT may self-register
    if (role !== UserRole.CLIENT) {
      res.status(400).json({
        error: 'Only CLIENT accounts can self-register. Patient portal accounts are created by your clinic.',
      });
      return;
    }

    // Employee type validation
    if (role === UserRole.EMPLOYEE && !employeeType) {
      res.status(400).json({ error: 'Employee type is required for EMPLOYEE role' });
      return;
    }

    if (role === UserRole.EMPLOYEE && !Object.values(EmployeeType).includes(employeeType)) {
      res.status(400).json({ error: 'Invalid employee type' });
      return;
    }

    // Client-specific required fields
    if (role === UserRole.CLIENT) {
      if (!gender || !region || !phone || !businessAddress || !hearAboutUs) {
        res.status(400).json({ 
          error: 'Missing required fields for CLIENT registration',
          required: ['gender', 'region', 'phone', 'businessAddress', 'hearAboutUs']
        });
        return;
      }

      // Gender validation
      if (!Object.values(Gender).includes(gender)) {
        res.status(400).json({ error: 'Invalid gender. Must be MALE, FEMALE, or OTHER' });
        return;
      }

      // Phone validation
      if (!validatePhone(phone)) {
        res.status(400).json({ error: 'Invalid phone number format' });
        return;
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        employeeType: role === UserRole.EMPLOYEE ? employeeType : null,
        gender: role === UserRole.CLIENT ? gender : null,
        region: role === UserRole.CLIENT ? region : null,
        phone: role === UserRole.CLIENT ? phone : null,
        website: role === UserRole.CLIENT ? website : null,
        businessAddress: role === UserRole.CLIENT ? businessAddress : null,
        hearAboutUs: role === UserRole.CLIENT ? hearAboutUs : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employeeType: true,
        gender: true,
        region: true,
        phone: true,
        website: true,
        businessAddress: true,
        hearAboutUs: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login and receive JWT token
 *     description: |
 *       Authenticate with email and password to receive a JWT access token.
 *       
 *       **Supported Roles:**
 *       - CLIENT: Doctors who create cases
 *       - EMPLOYEE: Designers and QC specialists
 *       - ADMIN: System administrators
 *       - PATIENT: Patient portal (accounts created by ADMIN)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *           examples:
 *             clientLogin:
 *               summary: CLIENT login
 *               value:
 *                 email: client@example.com
 *                 password: SecurePass123!
 *             employeeLogin:
 *               summary: EMPLOYEE login
 *               value:
 *                 email: designer@orthoalign.com
 *                 password: Designer123!
 *             adminLogin:
 *               summary: ADMIN login
 *               value:
 *                 email: admin@orthoalign.com
 *                 password: Admin123!
 *             patientLogin:
 *               summary: PATIENT portal login
 *               value:
 *                 email: patient.john@example.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clx123abc
 *                     email:
 *                       type: string
 *                       example: client@example.com
 *                     name:
 *                       type: string
 *                       example: Dr. John Doe
 *                     role:
 *                       type: string
 *                       example: CLIENT
 *                     employeeType:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeType: user.employeeType,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeType: user.employeeType,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset email
 *     description: |
 *       Always responds with a generic success message, whether or not the email
 *       is registered, to avoid leaking which accounts exist. If the account
 *       exists, a time-limited reset link is emailed to it.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: client@example.com
 *     responses:
 *       200:
 *         description: Generic acknowledgement (does not confirm account existence)
 */
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'A valid email is required' });
      return;
    }

    const genericMessage = 'If an account exists for that email, a reset link has been sent.';

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordTokenHash: hashResetToken(token),
          resetPasswordTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

      try {
        await EmailService.sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    res.json({ message: genericMessage });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using a token from the forgot-password email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid/expired token or password does not meet requirements
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Reset token is required' });
      return;
    }

    const passwordValidation = validatePassword(password || '');
    if (!passwordValidation.isValid) {
      res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: hashResetToken(token),
        resetPasswordTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'This reset link is invalid or has expired' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordTokenExpiresAt: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out (stateless JWT)
 *     description: |
 *       Acknowledges logout for API clients. Authentication uses stateless JWTs (7-day expiry);
 *       there is no server-side session store. The client must discard the access token after
 *       calling this endpoint (and clear local storage).
 *
 *       An optional `Authorization: Bearer` header may be sent; invalid or missing tokens still
 *       receive `200` so logout is idempotent from the client perspective.
 *
 *       **Future:** A token blocklist (e.g. Redis) could be added here to revoke tokens before expiry.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out
 */
router.post('/logout', authenticateOptional, (_req: Request, res: Response): void => {
  // Stateless JWT: no server session to destroy. Client discards token.
  // Future: tokenBlocklist.add(jti) when blocklist is implemented.
  res.json({ message: 'Logged out' });
});

export default router;
