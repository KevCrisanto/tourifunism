const mongoose = require('mongoose');
const multer = require('multer'); // handle enctype="multipart/form-data"
const jimp = require('jimp');
const uuid = require('uuid');

const Attraction = mongoose.model('Attraction');
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" });
    }
  },
};

exports.homePage = (req, res) => {
  res.render('index', { title: 'Home' });
};

exports.addAttraction = (req, res) => {
  res.render('editAttraction', { title: 'Add attraction' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createAttraction = async (req, res) => {
  const attraction = await new Attraction(req.body).save();
  // await attraction.save();
  req.flash('success', `Suuccessfully created ${attraction.name}. Care to leave a review?`);
  res.redirect(`/attraction/${attraction.slug}`);
};

exports.getAttractions = async (req, res) => {
  // 1. Query the database for a list of all attractions
  const attractions = await Attraction.find();
  console.log(attractions);
  res.render('attractions', { title: 'Tourist attractions', attractions }); // attractions: 'attractions'
};

exports.editAttraction = async (req, res) => {
  // 1. Find the attraction given the ID
  const attraction = await Attraction.findOne({ _id: req.params.id });
  // 2. Confirm the user posted the attraction
  // 3. Render out the edit form to the user
  res.render('editAttraction', { title: `Edit ${attraction.name}`, attraction });
};

exports.updateAttraction = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the attraction
  const attraction = await Attraction.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new data instead of the old one
    runValidators: true, // force to run validators
  }).exec();
  // Redirect then the attraction and tell them it worked
  req.flash(
    'success',
    `Successfully updated <strong>${attraction.name}</strong>. <a href="/attractions/${
      attraction.slug
    }">View tourist attraction ➡</a>`
  );
  res.redirect(`/attractions/${attraction._id}/edit`);
};

exports.getAttractionBySlug = async (req, res) => {
  const attraction = await Attraction.findOne({ slug: req.params.slug });
  if (!attraction) return next();
  res.render('attraction', { attraction, title: attraction.name });
};
