const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ToDoListSchema = new Schema({
    activity: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('ToDoList', ToDoListSchema);