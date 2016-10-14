const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  email: {
    type: String,
    index: true
  },
  password: String,
  idNum: String,
  idType: String,
  name: String,
  surname: String,
  birthDate: String,
  gender: String,
  address: String,
  phoneNumber: String,
  type: Array,
  disabled: Boolean,
  tempStr: String
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
