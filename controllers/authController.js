const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');

const User = mongoose.model('User');

// type of authentications is local, could be FB, Twitter, etc
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!',
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // first check if the user is authenticated
  if (req.isAuthenticated()) {
    next(); // carry on! They are logged in!
    return;
  }
  req.flash('error', 'Oops! You must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. Check if a user with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'An account with that email does not exist');
    return res.redirect('/login');
  }
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `If you have an account you will receive an email soon. ${resetURL}`);
  // 4. Redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }, // gt = greater than
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/loggin');
  }
  // if there is a user, show the reset password form
  res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }
  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/loggin');
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser); // log the user in
  req.flash('success', 'Nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
};
