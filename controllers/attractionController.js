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
  req.body.author = req.user._id;
  const attraction = await new Attraction(req.body).save();
  // await attraction.save();
  req.flash('success', `Suuccessfully created ${attraction.name}. Care to leave a review?`);
  res.redirect(`/attraction/${attraction.slug}`);
};

exports.getAttractions = async (req, res) => {
  // 1. Query the database for a list of all attractions
  const attractions = await Attraction.find();
  res.render('attractions', { title: 'Tourist attractions', attractions }); // attractions: 'attractions'
};

const confirmOwner = (attraction, user) => {
  // can add Admin, like so: ...author.equals(user._id) || user.level < 10
  if (!attraction.author.equals(user._id)) {
    throw Error('You must have published the tourist attraction in order to edit it!');
  }
};

exports.editAttraction = async (req, res) => {
  // 1. Find the attraction given the ID
  const attraction = await Attraction.findOne({ _id: req.params.id });
  // 2. Confirm the user posted the attraction
  confirmOwner(attraction, req.user);
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
    `Successfully updated <strong>${attraction.name}</strong>. <a href="/attraction/${
      attraction.slug
    }">View tourist attraction ➡</a>`
  );
  res.redirect(`/attractions/${attraction._id}/edit`);
};

exports.getAttractionBySlug = async (req, res, next) => {
  const attraction = await Attraction.findOne({ slug: req.params.slug }).populate('author');
  if (!attraction) return next();
  res.render('attraction', { attraction, title: attraction.name });
};

exports.getAttractionsByTag = async (req, res) => {
  const { tag } = req.params; // const tag = req.params.tag
  // Ask for attractions with the given tag. If there's no tag, return all attractions with at least one tag
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Attraction.getTagsList();
  const attractionsPromise = Attraction.find({ tags: tagQuery });
  const [tags, attractions] = await Promise.all([tagsPromise, attractionsPromise]);
  res.render('tag', { tags, title: 'Tags', tag, attractions });
};

exports.searchAttractions = async (req, res) => {
  const attractions = await Attraction
    // first find tourist attractions that match
    .find(
      {
        // will search both title and description, since both are type text
        $text: {
          $search: req.query.q,
        },
      },
      {
        score: { $meta: 'textScore' },
      }
    )
    // then sort them from highest to lowest
    .sort({
      score: { $meta: 'textScore' },
    })
    // limit to only 10 tourist attraction
    .limit(10);
  res.json(attractions);
};

exports.mapAttractions = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 10000, // 10 km
      },
    },
  };

  // Retrieve only photo and name: select('photo name');
  // Don't retrieve photo: select('-photo');
  const attractions = await Attraction.find(q)
    .select('slug name description location photo')
    .limit(10); // limit to 10 points in map
  res.json(attractions);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};
