const express = require('express');
const attractionController = require('../controllers/attractionController');
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

module.exports = router;
