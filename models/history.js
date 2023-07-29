const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }, 
  action : {
    type: String,
    required: true
  },
  fieldName: String | Array,

  previousValue: String | Array,

  newValue : String | Array,
}

)

module.exports = mongoose.model('History', historySchema)