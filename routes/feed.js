const express = require('express');
const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');

const router = express.Router();

// GET /feed/posts
router.get('/tasks', 
feedController.getTasks);

router.get('/history/logs', 
feedController.getHistory
)

router.get('/download',
 feedController.downloadCSVFile);

// POST /feed/post
router.post(
  '/task',
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('description')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createTask
);



router.put(
  '/task/:taskId',
  
  feedController.updateTask
);



router.delete('/task/:taskId', 
feedController.deleteTask);

module.exports = router;
