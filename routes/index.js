const express = require('express');
const attractionController = require('../controllers/attractionController');
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.get('/', catchErrors(attractionController.getAttractions));
router.get('/attractions', catchErrors(attractionController.getAttractions));
router.get('/add', attractionController.addAttraction);
router.post('/add', catchErrors(attractionController.createAttraction));
module.exports = router;
