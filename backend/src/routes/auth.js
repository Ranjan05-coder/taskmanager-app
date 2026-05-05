const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, password_hash]
      );

      const user = rows[0];
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(
        'SELECT id, name, email, password_hash FROM users WHERE email = $1',
        [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      delete user.password_hash;
      res.json({ token: signToken(user), user });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
