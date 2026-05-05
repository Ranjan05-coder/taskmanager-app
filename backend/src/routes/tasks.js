const router = require('express').Router({ mergeParams: true });
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(requireProjectMember);

// GET /api/projects/:projectId/tasks
router.get(
  '/',
  [
    query('status').optional().isIn(['todo', 'in_progress', 'done']),
    query('assignee').optional().isUUID(),
    query('priority').optional().isIn(['low', 'medium', 'high'])
  ],
  async (req, res, next) => {
    const { status, assignee, priority } = req.query;
    const conditions = ['t.project_id = $1'];
    const params = [req.params.projectId];

    if (status) { params.push(status); conditions.push(`t.status = $${params.length}`); }
    if (assignee) { params.push(assignee); conditions.push(`t.assignee_id = $${params.length}`); }
    if (priority) { params.push(priority); conditions.push(`t.priority = $${params.length}`); }

    try {
      const { rows } = await pool.query(
        `SELECT t.*, u.name AS assignee_name, u.email AS assignee_email,
          c.name AS created_by_name,
          CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS overdue
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assignee_id
         LEFT JOIN users c ON c.id = t.created_by
         WHERE ${conditions.join(' AND ')}
         ORDER BY t.priority DESC, t.due_date ASC NULLS LAST, t.created_at DESC`,
        params
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:projectId/tasks (admin only)
router.post(
  '/',
  requireProjectAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 300 }).withMessage('Title required'),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('assignee_id').optional().isUUID(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('due_date').optional().isISO8601().withMessage('Valid date required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, assignee_id, priority, due_date } = req.body;

    // Verify assignee is a project member
    if (assignee_id) {
      const check = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.projectId, assignee_id]
      );
      if (!check.rows.length) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, description || null, req.params.projectId, assignee_id || null, req.user.id, priority || 'medium', due_date || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/projects/:projectId/tasks/:taskId
router.patch(
  '/:taskId',
  [
    body('title').optional().trim().isLength({ min: 1, max: 300 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('assignee_id').optional({ nullable: true }).isUUID(),
    body('due_date').optional({ nullable: true }).isISO8601()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { taskId } = req.params;
    const { title, description, status, priority, assignee_id, due_date } = req.body;

    try {
      // Members can only update status of tasks assigned to them
      const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [taskId, req.params.projectId]);
      if (!taskRes.rows.length) return res.status(404).json({ error: 'Task not found' });

      const task = taskRes.rows[0];
      const isAdmin = req.projectRole === 'admin';
      const isAssignee = task.assignee_id === req.user.id;

      if (!isAdmin && !isAssignee) return res.status(403).json({ error: 'Not authorized to update this task' });
      if (!isAdmin && (title || priority || assignee_id !== undefined || due_date !== undefined)) {
        return res.status(403).json({ error: 'Members can only update status' });
      }

      const { rows } = await pool.query(
        `UPDATE tasks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          priority = COALESCE($4, priority),
          assignee_id = CASE WHEN $5::uuid IS NOT NULL THEN $5::uuid ELSE assignee_id END,
          due_date = COALESCE($6::date, due_date),
          updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [title || null, description ?? null, status || null, priority || null, assignee_id || null, due_date || null, taskId]
      );
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId/tasks/:taskId (admin only)
router.delete('/:taskId', requireProjectAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id = $2',
      [req.params.taskId, req.params.projectId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
