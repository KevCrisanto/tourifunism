const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const slug = require('slugs');

const attractionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'Pleae enter the name of the tourist attraction!',
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
      },
      coordinates: [
        {
          type: Number,
          required: 'You must supply coordinates!',
        },
      ],
      address: {
        type: String,
        required: 'You must supply and address!',
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: 'You must supply an author',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define our indexes
attractionSchema.index({
  name: 'text',
  description: 'text',
});

attractionSchema.index({ location: '2dsphere' });

attractionSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other attractions that have a slug of att, att-1, att-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const attractionsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (attractionsWithSlug.length) {
    this.slug = `${this.slug}-${attractionsWithSlug.length + 1}`;
  }
  next();
});

attractionSchema.statics.getTagsList = function() {
  // group attractions by tag and count the # of attractions in each tag, then sort by most popular
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }, // sort
  ]);
};

attractionSchema.statics.getTopAttractions = function() {
  // aggregate and virtual attributes don't work together :(
  return this.aggregate([
    // lookup attractions and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'attraction', as: 'reviews' } },
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    {
      $project: {
        // add photo, name, reviews, and slug. Won't be needed in future versions of MongoDB
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    },
    // sort it by our new field, highest revies first
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 10 },
  ]);
};

// find reviews where the attraction _id === reviews attraction property
attractionSchema.virtual('reviews', {
  ref: 'Review', // link to reviewSchema
  localField: '_id', // id in attractionSchema
  foreignField: 'attraction', // must match store in reviewSchema
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

attractionSchema.pre('find', autopopulate);
attractionSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Attraction', attractionSchema);
