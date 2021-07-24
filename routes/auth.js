const router = require('express').Router();
const User = require('../models/user');
const passport = require('passport');
const Donation = require('../models/donation');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({ accessToken: mapBoxToken})

const client = require('twilio')(process.env.A_SID, process.env.AUTH_TOKEN)

router.route('/login')
    .get((req, res) => {
        res.render('auth/login');
      })
    .post(
    passport.authenticate('local', {
    // successRedirect: '/',
    successReturnToOrRedirect: `/auth/redirect`,
    failureRedirect: '/auth/login',
    failureFlash: true,
    }));

router.route('/redirect')
    .get((req,res)=>{
      res.redirect(`/${req.user.role}`)
    })

router.route('/register/ngo')
    .get((req, res) => {
        res.render('auth/ngo_registration');
      })
    .post(
    async (req, res,next) => {
    try {
      const { ngo,email,password} = req.body;
      console.log(ngo)
      const doesExist = await User.findOne({ email });
      if (doesExist) {
        req.flash('error', 'Username/email already exists');
        res.redirect('/auth/register/ngo');
        return;
      }
      const geoData = await geoCoder.forwardGeocode({
        query: req.body.ngo.addr,
        limit: 1
      }).send()
      const user = new User({email,password});
      user.geometry = geoData.body.features[0].geometry;
      console.log(user.geometry)
      user.role="ngo"
      user.ngo=ngo
      await user.save();
      req.flash(
        'success',
        `${user.email} registered succesfully, you can now login`
      );
     
      res.redirect('/auth/login');
    } catch (error) {
      next(error);
    }
  }
);

router.route('/register/resto')
    .get((req, res) => {
        res.render('auth/resto_registration');
      })
    .post(
    async (req, res,next) => {
    try {
      const { resto,email,password} = req.body;
      const doesExist = await User.findOne({ email });
      if (doesExist) {
        req.flash('error', 'Username/email already exists');
        res.redirect('/auth/register/resto');
        return;
      }
      const geoData = await geoCoder.forwardGeocode({
        query: req.body.resto.addr,
        limit: 1
      }).send()
      const user = new User({email,password});
      user.geometry = geoData.body.features[0].geometry;
      user.role="resto"
      user.resto=resto
      await user.save();
      req.flash(
        'success',
        `${user.email} registered succesfully, you can now login`
      );
      res.redirect('/auth/login');
    } catch (error) {
      next(error);
    }
  }
);

router.route('/getOtp/:id')
  .get(async(req,res)=>{
    const donation = await Donation.findById(req.params.id)
    .populate({path: "resto"})
    .populate({path: "ngo"})
    console.log(donation)

    client
    .verify
    .services(process.env.SID)
    .verifications
    .create({
        to: `+91${donation.spoc_no}`,
        channel:'sms' 
    })
    .then(data => {
      req.flash("success",`OTP sent to ${donation.spoc}`);
      res.redirect("/resto/currentDonations")
    }) 
  })
  .post(async(req,res)=>{
    const donation = await Donation.findById(req.params.id)
    .populate({path: "resto"})
    .populate({path: "ngo"})

    if ((req.body.code).length === 6) {
      try {
        client
          .verify
          .services(process.env.SID)
          .verificationChecks
          .create({
              to: `+91${donation.spoc_no}`,
              code: req.body.code
          })
          .then(async(data) => {
              if (data.status === "approved") {
                await User.findOneAndUpdate({_id: donation.ngo._id }, { $set:{ isAccepted: "no"}}, {overwrite: false,new: true})
                donation.status = "Donated"
                donation.receivedOn = Date.now()
                await donation.save()
                req.flash("success","OTP accepted!");
                res.redirect("/resto/currentDonations")
              }
              else{
                req.flash("error",`Wrong OTP entered!`);
                res.redirect("/resto/currentDonations")
              }
          })
      } catch(e) {
        req.flash("error",`Generate OTP again!`);
        res.redirect("/resto/currentDonations")
      }
      
    } else {
      req.flash("error",`Wrong OTP entered!`);
      res.redirect("/resto/currentDonations")
    }
  })

router.get(
  '/logout',
  (req, res) => {
    req.logout();
    res.redirect('/');
  }
);


router.get('/addr',async(req,res)=>{
  const geoData = await geoCoder.forwardGeocode({
    query: "Andheri, Mumbai",
    limit: 1
  }).send()
  const c=geoData.body.features[0].geometry.coordinates
  
  console.log(`${c}/n${c[1]},${c[0]}`)
  res.render('map')
})

module.exports = router;