const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    duedate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      default: 'To-Do'
    }
  }
);

module.exports = mongoose.model('Task', taskSchema);
