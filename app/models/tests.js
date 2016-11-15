const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  questions: Array
});

module.exports = mongoose.model('Test', testSchema);
