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
  // 1. Query the database for a list of all stores
  const attractions = await Attraction.find();
  console.log(attractions);
  res.render('attractions', { title: 'Tourist attractions', attractions }); // attractions: 'attractions'
};
