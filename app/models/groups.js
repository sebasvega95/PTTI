const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
  name: {
    type: String,
    index: true
  },
  instNit: String,
  stage: String,
  workTime: String
});

module.exports = mongoose.model('Group', groupSchema);
