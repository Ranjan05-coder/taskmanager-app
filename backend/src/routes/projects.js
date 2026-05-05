const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

// All project routes require authentication
router.use(authenticate);

// GET /api/projects - list projects user is member of
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, pm.role, u.name AS owner_name,
        COUNT(DISTINCT t.id) AS task_count,
        COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END) AS done_count,
        COUNT(DISTINCT pm2.user_id) AS member_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN project_members pm2 ON pm2.project_id = p.id
       GROUP BY p.id, pm.role, u.name
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create project (user becomes admin)
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name required (max 200 chars)'),
    body('description').optional().trim().isLength({ max: 1000 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description || null, req.user.id]
      );
      const project = rows[0];
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [project.id, req.user.id, 'admin']
      );
      await client.query('COMMIT');
      res.status(201).json({ ...project, role: 'admin' });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// GET /api/projects/:projectId - project details
router.get('/:projectId', requireProjectMember, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS owner_name FROM projects p
       JOIN users u ON u.id = p.owner_id WHERE p.id = $1`,
      [req.params.projectId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json({ ...rows[0], role: req.projectRole });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId - update project (admin only)
router.put(
  '/:projectId',
  requireProjectAdmin,
  [
    body('name').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    try {
      const { rows } = await pool.query(
        `UPDATE projects SET
          name = COALESCE($1, name),
          description = COALESCE($2, description)
         WHERE id = $3 RETURNING *`,
        [name || null, description ?? null, req.params.projectId]
      );
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId (admin only)
router.delete('/:projectId', requireProjectAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/members
router.get('/:projectId/members', requireProjectMember, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name ASC`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/members - add member (admin only)
router.post(
  '/:projectId/members',
  requireProjectAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role } = req.body;
    try {
      const userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
      if (!userRes.rows.length) return res.status(404).json({ error: 'User not found. They must sign up first.' });

      const user = userRes.rows[0];
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
        [req.params.projectId, user.id, role]
      );
      res.status(201).json({ ...user, role });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId/members/:userId (admin only)
router.delete('/:projectId/members/:userId', requireProjectAdmin, async (req, res, next) => {
  try {
    const project = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.projectId]);
    if (project.rows[0]?.owner_id === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.projectId, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
