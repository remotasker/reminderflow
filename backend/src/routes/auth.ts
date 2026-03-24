import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { hashPassword, comparePasswords, generateToken } from '../utils/auth';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user and organization
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, organizationName } = req.body;
    
    if (!email || !password || !fullName || !organizationName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create organization
    const organizationId = uuidv4();
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    await query(
      'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)',
      [organizationId, organizationName, slug + '-' + organizationId.substring(0, 8)]
    );
    
    // Create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    
    await query(
      'INSERT INTO users (id, organization_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, organizationId, email, passwordHash, fullName, 'admin']
    );
    
    // Generate token
    const token = generateToken({
      userId,
      organizationId,
      email,
      role: 'admin',
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        email,
        fullName,
        organizationId,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.organization_id, u.role 
       FROM users u WHERE u.email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValid = await comparePasswords(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        organizationId: user.organization_id,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
