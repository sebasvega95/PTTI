const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');
const utilities = require('../app/utilities');

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
    console.log('Passoport:');
    console.log(req.body);
    User.findOne({'email': email}, (err, user) => {
      if (err)
        return done(err);
      if (user) {
        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
      } else {
        let newUser = new User();

        if (utilities.validateEmail(req.body.email))
          newUser.email = email;
        else
          return done(null, false, req.flash('signupMessage', 'Bad email.'));

        if (utilities.validatePassword(req.body.password))
          newUser.password = newUser.generateHash(password);
        else
          return done(null, false, req.flash('signupMessage', 'Password too weak.'));

        if (utilities.validateIdNum(req.body.idNum))
          newUser.idNum = req.body.idNum;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid ID number.'));

        if (utilities.validateIdType(req.body.idType))
          newUser.idType = req.body.idType;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid ID type.'));

        if (utilities.validateName(req.body.name) && utilities.validateName(req.body.surname)) {
          newUser.name = req.body.name;
          newUser.surname = req.body.surname;
        } else {
          return done(null, false, req.flash('signupMessage', 'Invalid name.'));
        }

        if (utilities.validateDate(req.body.birthDate))
          newUser.birthDate = req.body.birthDate;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid date.'));

        if (utilities.validateGender(req.body.gender))
          newUser.gender = req.body.gender;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid gender.'));

        if (utilities.validateName(req.body.address))
          newUser.address = req.body.address;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid address.'));

        if (utilities.validatePhoneNumber(req.body.phoneNumber))
          newUser.phoneNumber = req.body.phoneNumber;
        else
          return done(null, false, req.flash('signupMessage', 'Invalid phoneNumber.'));

        if (utilities.vaidateUserType(req.body.admin, req.body.psychologist, req.body.student)) {
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
