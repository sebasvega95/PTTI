module.exports = {
  validateEmail: function(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  validatePassword: function(password) {
    const re = /^(?=.*[0-9])(?=.*[A-Z])[a-zA-Z0-9._-]+$/;
    const lengthOk = password.length >= 8;
    return lengthOk && re.test(password);
  },

  validateIdNum: function(idNum) {
    const re = /^[0-9]+$/;
    return re.test(idNum);
  },

  validateIdType: function(idType) {
    return idType === 'cc' || idType === 'ti';
  },

  validateName: function (name) {
    const re = /^[a-zA-Z ]+$/;
    return re.test(name);
  },

  validateDate: function(date) {
    let [year, month, day] = date.split('-');
    const re = /^[0-9]+$/;
    if (!re.test(year) || !re.test(month) || !re.test(day))
      return false;

    let y = +year, m = +month, d = +day;
    let daysInMonth;
    switch (m) {
      case 1:
        daysInMonth = (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
      case 8: case 3: case 5: case 10:
        daysInMonth = 30;
      default:
      daysInMonth = 31
    }

    return m >= 0 && m < 12 && d > 0 && d <= daysInMonth;
  },

  validateGender: function(gender) {
    return gender === 'M' || gender === 'F';
  },

  validatePhoneNumber: function(phoneNumber) {
    const re = /^[0-9]+$/;
    const lengthOk = (phoneNumber.length === 7 || phoneNumber.length === 10);
    return lengthOk && re.test(phoneNumber);
  },

  vaidateUserType: function(admin, psychologist, student) {
    return admin || psychologist || student;
  }
};
