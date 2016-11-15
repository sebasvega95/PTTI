const User = require('../app/models/user');
const Institute = require('../app/models/institutes');
const utilities = require('./utilities');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport')

function isLoggedIn(req, res, next) {
  // console.log('isLoggedIn:');
  // console.log(req.user);
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}

const transport = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  auth: {
    user: 'ptti.noreply@gmail.com',
    pass: '=awesome.email='
  }
}));

module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    if (req.isAuthenticated())
      res.redirect('/profile');
    else
      res.render('index');
  });

  app.get('/login', (req, res) => {
    if (req.isAuthenticated())
      res.redirect('/profile');
    else
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
    if (req.isAuthenticated())
      res.redirect('/profile');
    else
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
      } else if (!utilities.validateName(req.body.address)) {
        req.flash('userManagementMessage', 'Invalid address.');
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
          address: req.body.address,
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

  app.post('/toggle-disable', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      User.findOne({email: req.body.orgEmail}, (err, user) => {
        if (err) {
          console.log(err);
          req.flash('userManagementMessage', 'Error writing to database.');
          res.redirect('/user-management');
        } else if (!user) {
          req.flash('userManagementMessage', 'No user found.');
          res.redirect('/user-management');
        } else {
          user.disabled = !user.disabled;
          let option;

          if (user.disabled)
            option = 'disabled';
          else
            option = 'enabled';
          user.save((err) => {
            if (err) {
              console.log(err);
              req.flash('userManagementMessage', 'Error writing to database.');
            } else {
              req.flash('userManagementMessage', `User ${option} successfully.`);
            }
            res.redirect('/user-management');
          });
        }
      });
    } else {
      res.redirect('/profile');
    }
  });

  app.post('/create-user', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      console.log('Create user:');
      console.log(req.body);
      User.findOne({'email': req.body.email}, (err, user) => {
        if (err) {
          console.log(err);
          req.flash('userManagementMessage', 'Error writing to database.');
          res.redirect('/user-management');
        } else if (user) {
          req.flash('userManagementMessage', 'That email is already taken.');
          res.redirect('/user-management');
        } else {
          let newUser = new User();

          if (utilities.validateEmail(req.body.email)) {
            newUser.email = req.body.email;
          } else {
            req.flash('userManagementMessage', 'Bad email.');
            return res.redirect('/user-management');
          }
          if (utilities.validatePassword(req.body.password)) {
            newUser.password = newUser.generateHash(req.body.password);
          } else {
            req.flash('userManagementMessage', 'Password too weak.');
            return res.redirect('/user-management');
          }
          if (utilities.validateIdNum(req.body.idNum)) {
            newUser.idNum = req.body.idNum;
          } else {
            req.flash('userManagementMessage', 'Invalid ID number.');
            return res.redirect('/user-management');
          }
          if (utilities.validateIdType(req.body.idType)) {
            newUser.idType = req.body.idType;
          } else {
            req.flash('userManagementMessage', 'Invalid ID type.');
            return res.redirect('/user-management');
          }
          if (utilities.validateName(req.body.name) && utilities.validateName(req.body.surname)) {
            newUser.name = req.body.name;
            newUser.surname = req.body.surname;
          } else {
            req.flash('userManagementMessage', 'Invalid name.');
            return res.redirect('/user-management');
          }

          if (utilities.validateDate(req.body.birthDate)) {
            newUser.birthDate = req.body.birthDate;
          } else {
            req.flash('userManagementMessage', 'Invalid date.');
            return res.redirect('/user-management');
          }
          if (utilities.validateGender(req.body.gender)) {
            newUser.gender = req.body.gender;
          } else {
            req.flash('userManagementMessage', 'Invalid gender.');
            return res.redirect('/user-management');
          }
          if (utilities.validateName(req.body.address)) {
            newUser.address = req.body.address;
          } else {
            req.flash('userManagementMessage', 'Invalid address.');
            return res.redirect('/user-management');
          }
          if (utilities.validatePhoneNumber(req.body.phoneNumber)) {
            newUser.phoneNumber = req.body.phoneNumber;
          } else {
            res.redirect('/user-management');
            return req.flash('userManagementMessage', 'Invalid phoneNumber.');
          }
          if (utilities.vaidateUserType(req.body.admin, req.body.psychologist, req.body.student)) {
            newUser.type = [];
            if (req.body.admin)
              newUser.type.push('admin');
            if (req.body.psychologist)
              newUser.type.push('psychologist');
            if (req.body.student)
              newUser.type.push('student');
          } else {
            req.flash('userManagementMessage', 'Invalid user type.');
            return res.redirect('/user-management');
          }

          newUser.disabled = true;
          newUser.save((err) => {
            if (err) {
              console.log(err);
              req.flash('userManagementMessage', 'Error writing to database.');
            } else {
              req.flash('userManagementMessage', 'User created successfully.');
            }
            res.redirect('/user-management');
          });
        }
      });
    } else {
      res.redirect('/profile');
    }
  });

  app.get('/institute-management', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      Institute.find({}, (err, institutes) => {
        if (err) {
          console.log(err);
          res.redirect('/profile');
        } else {
          res.render('institute-management', {
            message: req.flash('instituteManagementMessage'),
            user: req.user,
            institutes: institutes
          });
        }
      });
    } else {
      res.redirect('/profile');
    }
  });

  app.post('/institute-management', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      console.log('Wanna change:');
      console.log(req.body);
      if (!utilities.validateIdNum(req.body.nit)) {
        req.flash('instituteManagementMessage', 'Invalid NIT.');
      } else if (!utilities.validateName(req.body.name)) {
        req.flash('instituteManagementMessage', 'Invalid name.');
      } else if (!utilities.validatePhoneNumber(req.body.phoneNumber)) {
        req.flash('instituteManagementMessage', 'Invalid phoneNumber.');
      } else if (!utilities.validateName(req.body.address)) {
        req.flash('instituteManagementMessage', 'Invalid address.');
      } else if (!utilities.validateName(req.body.city)) {
        req.flash('instituteManagementMessage', 'Invalid city.');
      } else if(!utilities.validateWebsite(req.body.website)) {
        req.flash('instituteManagementMessage', 'Invalid website.');
      } else {
        let changes = {
          nit: req.body.nit,
          name: req.body.name,
          phoneNumber: req.body.phoneNumber,
          address: req.body.address,
          city: req.body.city,
          website: req.body.website
        };

        Institute.update({nit: req.body.orgNit}, changes, (err, data) => {
          if (err) {
            console.log(err);
            req.flash('instituteManagementMessage', 'Error writing to database.');
          } else {
            req.flash('instituteManagementMessage', 'Changes saved successfully.');
          }
          res.redirect('/institute-management');
        });
      }
    } else {
      res.redirect('/profile');
    }
  });

  app.post('/create-institute', isLoggedIn, (req, res) => {
    if (req.user.type.indexOf('admin') !== -1) {
      console.log('Create institute:');
      console.log(req.body);
      Institute.findOne({'nit': req.body.nit}, (err, institute) => {
        if (err) {
          console.log(err);
          req.flash('instituteManagementMessage', 'Error writing to database.');
          res.redirect('/institute-management');
        } else if (institute) {
          req.flash('instituteManagementMessage', 'That NIT is already taken.');
          res.redirect('/institute-management');
        } else {
          let newInst = new Institute();

          if (utilities.validateIdNum(req.body.nit)) {
            newInst.nit = req.body.nit;
          } else {
            req.flash('instituteManagementMessage', 'Invalid NIT.');
            return res.redirect('/institute-management');
          }
          if (utilities.validateName(req.body.name)) {
            newInst.name = req.body.name;
          } else {
            req.flash('instituteManagementMessage', 'Invalid name.');
            return res.redirect('/institute-management');
          }
          if (utilities.validateName(req.body.address)) {
            newInst.address = req.body.address;
          } else {
            req.flash('instituteManagementMessage', 'Invalid address.');
            return res.redirect('/institute-management');
          }
          if (utilities.validatePhoneNumber(req.body.phoneNumber)) {
            newInst.phoneNumber = req.body.phoneNumber;
          } else {
            res.redirect('/institute-management');
            return req.flash('instituteManagementMessage', 'Invalid phoneNumber.');
          }
          if (utilities.validateName(req.body.city)) {
            newInst.city = req.body.city;
          } else {
            req.flash('instituteManagementMessage', 'Invalid city.');
            return res.redirect('/institute-management');
          }
          if (utilities.validateWebsite(req.body.website)) {
            newInst.website = req.body.website;
          } else {
            req.flash('instituteManagementMessage', 'Invalid website.');
            return res.redirect('/institute-management');
          }

          newInst.save((err) => {
            if (err) {
              console.log(err);
              req.flash('instituteManagementMessage', 'Error writing to database.');
            } else {
              req.flash('instituteManagementMessage', 'Institute created successfully.');
            }
            res.redirect('/institute-management');
          });
        }
      });
    } else {
      res.redirect('/profile');
    }
  });

  app.get('/forgot-pass', (req, res) => {
    res.render('forgot-pass', {
      message: req.flash('forgotPassMessage')
    });
  });

  app.post('/forgot-pass', (req, res) => {
    console.log('Forgot pass:');
    console.log(req.body);
    const temp = randomstring.generate(7);
    User.findOne({email: req.body.email}, (err, user) => {
      if (user) {
        user.tempStr = temp;
        user.save((err) => {
          if (err) {
            console.log(err);
            req.flash('forgotPassMessage', 'Error writing to database.');
            res.redirect('/forgot-pass');
          } else {
            const mailOptions = {
              from: 'PTTI Team <ptti.noreply@gmail.com>',
              to: req.body.email,
              subject: 'Reset password fot PTTI',
              text: `Hello ${req.body.email}!
              The code to reset your password is ${temp}.
              Regards, the PTTI team.`
            };
            transport.sendMail(mailOptions, (err, info) => {
              if (err) {
                console.log(err);
                req.flash('forgotPassMessage', 'Error while resetting password. Try Again!');
                res.redirect('/forgot-pass');
              } else {
                req.flash('resetPassMessage', 'Check your email and enter the verification code to reset your password.');
                req.flash('resetPassEmail', req.body.email);
                res.redirect('/reset-pass');
              }
            });
          }
        });
      } else {
        req.flash('forgotPassMessage', 'Email does not exists.');
        res.redirect('/forgot-pass');
      }
    });
  });

  app.get('/reset-pass', (req, res) => {
    res.render('reset-pass', {
      message: req.flash('resetPassMessage'),
      email: req.flash('resetPassEmail')
    });
  });

  app.post('/reset-pass', (req, res) => {
    console.log('Reset pass:');
    console.log(req.body);
    User.findOne({email: req.body.email}, (err, user) => {
      if (user) {
        const tempStr = user.tempStr;

        if (req.body.code === tempStr) {
          if (utilities.validatePassword(req.body.npass)) {
            user.password = user.generateHash(req.body.npass);
            user.tempStr = "";
            user.save((err) => {
              if (err) {
                console.log(err);
                req.flash('resetPassMessage', 'Error writing to database.');
                req.flash('resetPassEmail', req.body.email);
                res.redirect('/reset-pass');
              } else {
                req.flash('loginMessage', 'Password reset successfully.');
                res.redirect('/login');
              }
            });
          } else {
            req.flash('resetPassMessage', 'New password is too weak, try again!');
            req.flash('resetPassEmail', req.body.email);
            res.redirect('/reset-pass');
          }
        } else {
          req.flash('resetPassMessage', 'Code doest not match, try again!');
          req.flash('resetPassEmail', req.body.email);
          res.redirect('/reset-pass');
        }
      } else {
        req.flash('resetPassMessage', 'Error with email. Try again.');
        req.flash('resetPassEmail', req.body.email);
        res.redirect('/reset-pass');
      }
    });
  });
};
