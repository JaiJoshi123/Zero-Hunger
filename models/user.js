const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const stringifyBoolean = require('@mapbox/mapbox-sdk/services/service-helpers/stringify-booleans');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({ accessToken: mapBoxToken})

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  geometry: {
    type: {
        type: String,
        enum: ['Point'],
        
    },
    coordinates: {
        type: [Number],
        
    }
},
  role: {
    type: String,
    enum: ['ngo','resto']
  },
  ngo: {
      name: {
        type: String
      },
      licno: {
          type: Number
      },
      website: {
        type: String
      },
      phone: {
        type: Number
      },
      addr: {
        type: String
      },
      ppoc:{
        type: String
      },
      ppoc_no:{
        type: Number
      },
      city: {
        type: String
      },
      spoc:String,
      spoc_no:Number
  },
  resto: {
      name: {
          type: String
      },
      fassaino: {
          type: Number
      },
      website: {
        type: String
      },
      phone: {
        type: String
      },
      addr: {
        type: String
      },
      city: { type: String},
      food:{
        type: String,
        enum: ['Vegetarian','Non-Vegetarian','Both']
      },
      rating:{
        type: Number,
        default: 0
      }
  },
  isAccepted: {
    type: String,
    default: "no"
  }
});

UserSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};

UserSchema.methods.ngoCreateCoord = async function(){
  const geoData = await geoCoder.forwardGeocode({
    query: this.ngo.addr,
    limit: 1
  }).send()
  this.geometry = geoData.body.features[0].geometry;
  this.save()
}

UserSchema.methods.restoCreateCoord = async function(){
  const geoData = await geoCoder.forwardGeocode({
    query: this.resto.addr,
    limit: 1
  }).send()
  this.geometry = geoData.body.features[0].geometry;
  this.save()
}

const User = mongoose.model('user', UserSchema);
module.exports = User;