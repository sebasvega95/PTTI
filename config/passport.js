const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function validatePassword(password) {
  const re = /^(?=.*[0-9])(?=.*[A-Z])[a-zA-Z0-9._-]+$/;
  const lengthOk = password.length >= 8;
  return lengthOk && re.test(password);
}

function validateIdNum(idNum) {
  const re = /^[0-9]+$/;
  return re.test(idNum);
}

function validateIdType(idType) {
  return idType === 'cc' || idType === 'ti';
}

function validateName(name) {
  const re = /^[a-zA-Z ]+$/;
  return re.test(name);
}

function validateDate(date) {
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
}

function validateGender(gender) {
  return gender === 'M' || gender === 'F';
}

function validatePhoneNumber(phoneNumber) {
  const re = /^[0-9]+$/;
  const lengthOk = (phoneNumber.length === 7 || phoneNumber.length === 10);
  return lengthOk && re.test(phoneNumber);
}

function vaidateUserType(admin, psychologist, student) {
  return admin || psychologist || student;
}

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, (req, email, password, done) => {
    console.log(req.body);
    User.findOne({'email': email}, (err, user) => {
      if (err)
        return done(err);
      if (user) {
        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
      } else {
        let newUser = new User();

        if (validateEmail(req.body.email))
          newUser.email = email;
        else
          return done(null, false, req.flash('signupMessage', 'Bad email.'));

        if (validatePassword(req.body.password))
          newUser.password = newUser.generateHash(password);
        else
          return done(null, false, req.flash('signupMessage', 'Password too weak.'));

        if (validateIdNum(req.body.idNum))
          newUser.idNum = req.body.idNum;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid ID number.'));

        if (validateIdType(req.body.idType))
          newUser.idType = req.body.idType;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid ID type.'));

        if (validateName(req.body.name) && validateName(req.body.surname)) {
          newUser.name = req.body.name;
          newUser.surname = req.body.surname;
        } else {
          return done(null, false, req.flash('signupMessage', 'Invalid name.'));
        }

        if (validateDate(req.body.birthDate))
          newUser.birthDate = req.body.birthDate;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid date.'));

        if (validateGender(req.body.gender))
          newUser.gender = req.body.gender;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid gender.'));

        if (validateName(req.body.address))
          newUser.address = req.body.address;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid address.'));

        if (validatePhoneNumber(req.body.phoneNumber))
          newUser.phoneNumber = req.body.phoneNumber;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid phoneNumber.'));

        if (vaidateUserType(req.body.admin, req.body.psychologist, req.body.student)) {
          newUser.type = [];
          if (req.body.admin)
            newUser.type.push('admin');
          if (req.body.psychologist)
            newUser.type.push('psychologist');
          if (req.body.student)
            newUser.type.push('student');
        } else {
          return done(null, false, req.flash('signupMessage', 'Invalid user type.'));
        }

        newUser.disabled = true;
        newUser.save((err) => {
          if (err)
            throw err;
          return done(null, newUser);
        });
      }
    });
  }));

  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, (req, email, password, done) => {
    console.log(req.body);
    User.findOne({'email': email}, (err, user) => {
      if (err)
        return done(err);
      if (!user)
        return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password))
        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
      if (user.disabled)
        return done(null, false, req.flash('loginMessage', 'Your account is currently disabled.'));
      return done(null, user);
    });
  }));
};
