const mongoose = require('mongoose');

const Attraction = mongoose.model('Attraction');

exports.homePage = (req, res) => {
  res.render('index', { title: 'Home' });
};

exports.addAttraction = (req, res) => {
  res.render('editAttraction', { title: 'Add attraction' });
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
