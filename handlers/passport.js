const passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser()); // get information from a user object to store in a session
passport.deserializeUser(User.deserializeUser()); // take that information and turn it back into a user object
