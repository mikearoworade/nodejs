const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Middleware
app.use(cors());
app.use(express.json());

// File system utilities
class FileStorage {
  constructor() {
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.mkdir(BACKUP_DIR, { recursive: true });

      // Check if tasks file exists, if not create it with sample data
      try {
        await fs.access(TASKS_FILE);
      } catch (error) {
        await this.createInitialData();
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  async createInitialData() {
    const sampleTasks = [
      {
        id: uuidv4(),
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the task manager API',
        status: 'pending',
        priority: 'high',
        dueDate: '2025-07-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Code review',
        description: 'Review pull requests from team members',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2025-07-18',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    await this.saveTasks(sampleTasks);
  }

  async loadTasks() {
    try {
      const data = await fs.readFile(TASKS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  async saveTasks(tasks) {
    try {
      // Create backup before saving
      await this.createBackup();

      const data = JSON.stringify(tasks, null, 2);
      await fs.writeFile(TASKS_FILE, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `tasks-backup-${timestamp}.json`);

      // Check if current file exists before backing up
      try {
        await fs.access(TASKS_FILE);
        await fs.copyFile(TASKS_FILE, backupFile);

        // Keep only last 10 backups
        await this.cleanupBackups();
      } catch (error) {
        // File doesn't exist yet, skip backup
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  async cleanupBackups() {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files
        .filter(file => file.startsWith('tasks-backup-'))
        .sort()
        .reverse();

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(BACKUP_DIR, file));
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  async getFileStats() {
    try {
      const stats = await fs.stat(TASKS_FILE);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }
}

// Initialize file storage
const storage = new FileStorage();

// Utility functions
const findTaskById = (tasks, id) => tasks.find(task => task.id === id);
const findTaskIndex = (tasks, id) => tasks.findIndex(task => task.id === id);

// Validation middleware
const validateTask = (req, res, next) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be pending, in-progress, or completed' });
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Priority must be low, medium, or high' });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: 'Due date must be a valid date' });
  }

  next();
};

// Routes

// Health check
app.get('/health', async (req, res) => {
  const fileStats = await storage.getFileStats();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    storage: {
      type: 'file_system',
      dataFile: TASKS_FILE,
      fileStats
    }
  });
});

// Task statistics (must be before parameterized routes)
app.get('/api/tasks/stats', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const stats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      overdue: tasks.filter(task =>
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
      ).length,
      byPriority: {
        low: tasks.filter(task => task.priority === 'low').length,
        medium: tasks.filter(task => task.priority === 'medium').length,
        high: tasks.filter(task => task.priority === 'high').length
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

// Bulk operations (must be before parameterized routes)
app.post('/api/tasks/bulk', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const { tasks: taskList } = req.body;

    if (!Array.isArray(taskList)) {
      return res.status(400).json({ error: 'Tasks must be an array' });
    }

    const createdTasks = [];
    const errors = [];

    taskList.forEach((taskData, index) => {
      const { title, description, status = 'pending', priority = 'medium', dueDate } = taskData;

      if (!title || title.trim() === '') {
        errors.push({ index, error: 'Title is required' });
        return;
      }

      const newTask = {
        id: uuidv4(),
        title: title.trim(),
        description: description ? description.trim() : '',
        status,
        priority,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tasks.push(newTask);
      createdTasks.push(newTask);
    });

    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save tasks' });
    }

    res.status(201).json({
      created: createdTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tasks' });
  }
});

// Get all tasks with optional filtering and pagination
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    let filteredTasks = [...tasks];

    // Filter by status
    if (req.query.status) {
      filteredTasks = filteredTasks.filter(task => task.status === req.query.status);
    }

    // Filter by priority
    if (req.query.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === req.query.priority);
    }

    // Search by title or description
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by created date (newest first by default)
    const sortBy = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    filteredTasks.sort((a, b) => {
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return (new Date(a[sortBy]) - new Date(b[sortBy])) * sortOrder;
      }
      return (a[sortBy] > b[sortBy] ? 1 : -1) * sortOrder;
    });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    res.json({
      tasks: paginatedTasks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredTasks.length / limit),
        totalItems: filteredTasks.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

// Create a new task
app.post('/api/tasks', validateTask, async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const { title, description, status = 'pending', priority = 'medium', dueDate } = req.body;

    const newTask = {
      id: uuidv4(),
      title: title.trim(),
      description: description ? description.trim() : '',
      status,
      priority,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);
    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save task' });
    }

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get a specific task (must be after other specific routes)
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const task = findTaskById(tasks, req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load task' });
  }
});

// Update a task (full update)
app.put('/api/tasks/:taskId', validateTask, async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const taskIndex = findTaskIndex(tasks, req.params.taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, status, priority, dueDate } = req.body;

    const updatedTask = {
      ...tasks[taskIndex],
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || tasks[taskIndex].status,
      priority: priority || tasks[taskIndex].priority,
      dueDate: dueDate !== undefined ? dueDate : tasks[taskIndex].dueDate,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;
    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save task' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Partially update a task
app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const taskIndex = findTaskIndex(tasks, req.params.taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Validate specific fields if they're being updated
    if (req.body.status && !['pending', 'in-progress', 'completed'].includes(req.body.status)) {
      return res.status(400).json({ error: 'Status must be pending, in-progress, or completed' });
    }

    if (req.body.priority && !['low', 'medium', 'high'].includes(req.body.priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    if (req.body.dueDate && isNaN(Date.parse(req.body.dueDate))) {
      return res.status(400).json({ error: 'Due date must be a valid date' });
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;
    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save task' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const tasks = await storage.loadTasks();
    const taskIndex = findTaskIndex(tasks, req.params.taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save changes' });
    }

    res.json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Backup management routes
app.get('/api/backups', async (req, res) => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('tasks-backup-'))
      .sort()
      .reverse();

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          filename: file,
          created: stats.birthtime,
          size: stats.size
        };
      })
    );

    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Restore from backup
app.post('/api/restore', async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const backupFile = path.join(BACKUP_DIR, filename);

    // Check if backup file exists
    try {
      await fs.access(backupFile);
    } catch (error) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Read backup data
    const backupData = await fs.readFile(backupFile, 'utf8');
    const tasks = JSON.parse(backupData);

    // Save as current tasks
    const saved = await storage.saveTasks(tasks);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to restore backup' });
    }

    res.json({ message: 'Backup restored successfully', tasksCount: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler - FIXED: Use a proper route pattern
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Task Manager API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
  console.log(`Data directory: ${DATA_DIR}`);
});

module.exports = app;