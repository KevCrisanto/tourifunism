const express = require('express');
const attractionController = require('../controllers/attractionController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.get('/', catchErrors(attractionController.getAttractions));
router.get('/attractions', catchErrors(attractionController.getAttractions));
router.get('/attractions/page/:page', catchErrors(attractionController.getAttractions));

router.get('/add', authController.isLoggedIn, attractionController.addAttraction);

router.post(
  '/add',
  attractionController.upload,
  catchErrors(attractionController.resize),
  catchErrors(attractionController.createAttraction)
);

router.post(
  '/add/:id',
  attractionController.upload,
  catchErrors(attractionController.resize),
  catchErrors(attractionController.updateAttraction)
);

router.get('/attractions/:id/edit', catchErrors(attractionController.editAttraction));

router.get('/attraction/:slug', catchErrors(attractionController.getAttractionBySlug));

router.get('/tags', catchErrors(attractionController.getAttractionsByTag));
router.get('/tags/:tag', catchErrors(attractionController.getAttractionsByTag));

router.get('/tags/page/:page', catchErrors(attractionController.getAttractionsByTag));
router.get('/tags/:tag/page/:page', catchErrors(attractionController.getAttractionsByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);

router.post(
  '/register',
  userController.validateRegister, // 1. Validate registration data
  userController.register, // 2. Register the user, add it to DB
  authController.login // 3. We need to log them in
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));

router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post(
  '/account/reset/:token',
  authController.confirmedPasswords, // check if both passwords are the same
  catchErrors(authController.update)
);
router.get('/map', attractionController.mapPage);

router.get('/hearts', catchErrors(attractionController.getHearts));
router.get('/hearts/page/:page', catchErrors(attractionController.getHearts));

router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

router.get('/top', catchErrors(attractionController.getTopAttractions));

/*
  API
*/

router.get('/api/search', catchErrors(attractionController.searchAttractions));

router.get('/api/attractions/near', catchErrors(attractionController.mapAttractions));

router.post('/api/attractions/:id/heart', authController.isLoggedIn, catchErrors(attractionController.heartAttraction));

module.exports = router;
