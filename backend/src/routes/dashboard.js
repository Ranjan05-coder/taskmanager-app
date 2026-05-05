const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard - aggregate stats for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [projectsRes, myTasksRes, overdueRes, activityRes] = await Promise.all([
      // Projects summary
      pool.query(
        `SELECT p.id, p.name, pm.role,
          COUNT(DISTINCT t.id) AS total_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) AS in_progress_tasks,
          COUNT(DISTINCT CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN t.id END) AS overdue_tasks
         FROM projects p
         JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
         LEFT JOIN tasks t ON t.project_id = p.id
         GROUP BY p.id, p.name, pm.role
         ORDER BY overdue_tasks DESC, p.created_at DESC`,
        [userId]
      ),
      // My assigned tasks
      pool.query(
        `SELECT t.*, p.name AS project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.assignee_id = $1 AND t.status != 'done'
         ORDER BY t.due_date ASC NULLS LAST, t.priority DESC
         LIMIT 10`,
        [userId]
      ),
      // Overdue count
      pool.query(
        `SELECT COUNT(*) AS count FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
         WHERE t.due_date < NOW() AND t.status != 'done'`,
        [userId]
      ),
      // Recent task updates
      pool.query(
        `SELECT t.id, t.title, t.status, t.updated_at, p.name AS project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
         ORDER BY t.updated_at DESC
         LIMIT 5`,
        [userId]
      )
    ]);

    res.json({
      projects: projectsRes.rows,
      myTasks: myTasksRes.rows,
      overdue: parseInt(overdueRes.rows[0].count),
      recentActivity: activityRes.rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
