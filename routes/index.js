const express = require('express');
const attractionController = require('../controllers/attractionController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.get('/', catchErrors(attractionController.getAttractions));
router.get('/attractions', catchErrors(attractionController.getAttractions));
router.get('/add', attractionController.addAttraction);

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

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

router.post(
  '/register',
  userController.validateRegister, // 1. Validate registration data
  userController.register, // 2. Register the user, add it to DB
  authController.login // 3. We need to log them in
);

module.exports = router;
