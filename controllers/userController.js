const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login Form' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name'); // using express-validator to clean up HTML
  req.checkBody('name', 'You must supply a name!').notEmpty(); // check if there's no name
  req
    .checkBody('email', 'That Email is not valid!')
    .notEmpty()
    .isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmai_remove_subaddress: false,
  });
  req.checkBody('password', 'Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
  }
};
