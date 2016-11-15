const mongoose = require('mongoose');

const instituteSchema = mongoose.Schema({
  nit: {
    type: String,
    index: true
  },
  name: String,
  address: String,
  phoneNumber: String,
  city: String,
  website: String
});

module.exports = mongoose.model('Institute', instituteSchema);
