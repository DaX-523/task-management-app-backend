
const { validationResult } = require('express-validator/check');
const createCsvWriter  = require('csv-writer').createObjectCsvWriter
const path = require('path');
const fs = require('fs');
const Task = require('../models/task');
const History = require('../models/history');

function customSort(tasks) {
  return tasks.sort(function (a, b) {
    const priority = {
      'High' : 1,
      'Medium': 2,
      'Low': 3
    }
    return priority[a.priority ] - priority[b.priority];
  })
}

function writeCustomCsv(fileName, filePath) {

  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      {id: 'title', title: 'TITLE'},
      {id: 'duedate', title: 'DUEDATE'},
      {id: 'description', title: 'DESCRIPTION'},
      {id: 'priority', title: 'PRIORITY'},
      {id: 'status', title: 'STATUS'}

  ]
  })

  return csvWriter
}

exports.getTasks = (req, res, next) => {
  const sortBy = req.query.sortBy.toLowerCase();
  const sortType = sortBy === 'status' && sortBy !== 'priority' ? 'desc' : 'asc';
  let sortFlag = false;
  if (sortBy === 'priority') {
    sortFlag = true
  }
  let totalItems;
  Task.find()
    .countDocuments()
    .then(count => {
      totalItems = count;
      if (!sortBy) {
        return Task.find()
      }
      return Task.find()
      .sort([[sortBy, sortType]])        
    })
    .then(tasks => {
      if (sortFlag) {
        tasks = customSort(tasks)
      }
      res.status(200).json({
        message: 'Fetched tasks successfully.',
        tasks: tasks,
        totalItems: totalItems
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getHistory = (req, res, next) => {

  History.find()

    .then(history => {
      if (!history) {
        const error = new Error('Could not find history.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Fetched history successfully.',
        history: history
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createTask = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const {title, duedate, description, priority} = req.body;
 
  const task = new Task({
    title: title,
    duedate: duedate,
    description: description,
    priority: priority
  });
  task
    .save()
    .then(result => {
      const history = new History({
        taskId: result._id.toString(),
        action: 'Create',
        fieldName: null, //fieldName is null at the time of document creation
        previousValue: null,
        newValue: result._id.toString()
      })
      return history.save()
    })
    .then(() => {
      res.status(201).json({
        message: 'Task created successfully!',
        task: task
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};



exports.updateTask = (req, res, next) => {
  const taskId = req.params.taskId;

  const {title, description, duedate, priority, status} = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  let previousValue;
  let newValue;
  Task.findById(taskId)
    .then(task => {

      if (!task) {
        const error = new Error('Could not find task.');
        error.statusCode = 404;
        throw error;
      }
      previousValue = [task.title, task.description, task.duedate, task.priority, task.status];
      task.title = title;
      task.description = description;
      task.duedate = duedate;
      task.priority = priority;
      task.status = status;
      newValue = [task.title, task.description, task.duedate, task.priority, task.status];
  
      return task.save();
    })
    .then(result => {
      const history = new History({
        taskId: result._id.toString(),
        action: 'Edit',
        fieldName: ['title', 'description', 'duedate', 'priority', 'status'],
        previousValue: previousValue,
        newValue: newValue
      })
      return history.save()
    })
    .then(result => {
      res.status(200).json({ message: 'Task updated!', task: newValue});
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deleteTask = (req, res, next) => {
  const taskId = req.params.taskId;
  Task.findById(taskId)
    .then(task => {
      if (!task) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
   
      return Task.findByIdAndRemove(taskId);
    })
    .then(result => {
      const history = new History({
        taskId: taskId,
        action: 'Delete',
        fieldName: null,  //fieldName is null at the time of document deletion
        previousValue: taskId,
        newValue: null
      })
      return history.save()
    })
    .then(result => {
      res.status(200).json({ message: 'Deleted task.' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};



exports.downloadCSVFile = (req, res, next) => {
  let fileName = 'file' + Date.now().toString() + '.csv';
  let filePath = path.join(__dirname, '..', 'data', 'csvfiles', fileName)
  Task.find()
  .then(tasks => {
    let csvWriter = writeCustomCsv(fileName, filePath)
    return csvWriter.writeRecords(tasks)
  })
  .then(() => {
    console.debug(filePath)
    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        return next(err);
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"' )
      return res.sendFile(filePath)
    })
    
  })
  // .then(() => {
  //   return res.status(200).json({
  //     status: 'success'
  //   })
  // })
  .catch(err => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}