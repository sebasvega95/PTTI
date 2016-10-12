function isLoggedIn(req, res, next) {
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
    res.render('login', {message: req.flash('loginMessage')});
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }));

  app.get('/signup', (req, res) => {
    res.render('signup', {message: req.flash('signupMessage')});
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
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
    if (user.req.type.indexOf('admin') !=== -1) {
      res.render('user-management', {
        user:req.user
      });
    } else {
      req.flash('message', 'You don\'t have the necessary permissions.');
      res.redirect('/profile');
    }
  });
};
