const User = require('../app/models/user');
const utilities = require('./utilities');

function isLoggedIn(req, res, next) {
  console.log('isLoggedIn:');
  console.log(req.user);
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}

module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/login', (req, res) => {
    res.render('login', {
      message: req.flash('loginMessage')
    });
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.get('/signup', (req, res) => {
    res.render('signup', {
      message: req.flash('signupMessage')
    });
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true,
    session: false
  }));

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', {
      user: req.user
    });
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.get('/user-management', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      User.find({}, (err, users) => {
        if (err) {
          console.log(err);
          res.redirect('/profile');
        } else {
          res.render('user-management', {
            message: req.flash('userManagementMessage'),
            user: req.user,
            users: users
          });
        }
      });
    } else {
      res.redirect('/profile');
    }
  });

  app.post('/user-management', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      console.log('Wanna change:');
      console.log(req.body);
      if (!utilities.validateEmail(req.body.email)) {
        req.flash('userManagementMessage', 'Bad email.');
      } else if (!utilities.validateIdNum(req.body.idNum)) {
        req.flash('userManagementMessage', 'Invalid ID number.');
      } else if (!utilities.validateIdType(req.body.idType)) {
        req.flash('userManagementMessage', 'Invalid ID type.');
      } else if (!utilities.validateName(req.body.name) || !utilities.validateName(req.body.surname)) {
        req.flash('userManagementMessage', 'Invalid name.');
      } else if (!utilities.validateDate(req.body.birthDate)) {
        req.flash('userManagementMessage', 'Invalid date.');
      } else if (!utilities.validateGender(req.body.gender)) {
        req.flash('userManagementMessage', 'Invalid gender.');
      } else if (!utilities.validatePhoneNumber(req.body.phoneNumber)) {
        req.flash('userManagementMessage', 'Invalid phoneNumber.');
      } else if(!utilities.vaidateUserType(req.body.admin, req.body.psychologist, req.body.student)) {
        req.flash('userManagementMessage', 'Invalid user type.');
      } else {
        let changes = {
          email: req.body.email,
          idNum: req.body.idNum,
          idType: req.body.idType,
          name: req.body.name,
          surname: req.body.surname,
          birthDate: req.body.birthDate,
          gender: req.body.gender,
          phoneNumber: req.body.phoneNumber,
          type: []
        };

        if (req.body.admin)
          changes.type.push('admin');
        if (req.body.psychologist)
          changes.type.push('psychologist');
        if (req.body.student)
          changes.type.push('student');

        User.update({email: req.body.orgEmail}, changes, (err, data) => {
          if (err) {
            console.log(err);
            req.flash('userManagementMessage', 'Error writing to database.');
          } else {
            req.flash('userManagementMessage', 'Changes saved successfully.');
          }
          res.redirect('/user-management');
        });
      }
    } else {
      res.redirect('/profile');
    }
  });
};
