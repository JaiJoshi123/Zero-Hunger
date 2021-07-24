const router = require('express').Router();
const User = require('../models/user');
const Donation = require('../models/donation');
const Review = require('../models/reviews');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({ accessToken: mapBoxToken })

router.route("/")
    .get((req, res) => {
        res.render('ngo/ngo_profile')
    })

router.route("/donations")
    .get(async (req, res) => {
        const donations = await Donation.find({}).populate({ path: 'resto' })
        const currDate=Date.now();
        //console.log(donations)
        res.render("ngo/choose_donation", { donations})
    })
    .post(async (req, res) => {
        if (req.user.isAccepted === "no") {
            const donation = await Donation.findById(req.body.id).populate({ path: 'resto' })
            if (donation.status === "Available") {
                const user = await User.findById(req.user._id)
                donation.ngo = req.user
                donation.status = "Accepted"
                user.isAccepted = "yes"
                donation.spoc=req.body.ngo.spoc
                donation.spoc_no=req.body.ngo.spoc_no
                await user.save()
                await donation.save()
                req.flash('success', "Accepted the donation successfully")
                res.redirect("/ngo/currentPickup")
            }else{
                console.log("Not available")
                req.flash('error', 'Donation not available!')
                res.redirect("/ngo/donations")
            }
        }
        else {
            console.log("Not accepted")
            req.flash('error', 'Complete previous donation!')
            res.redirect("/ngo/donations")
        }
    })

router.route("/pastOrders")
    .get(async (req, res) => {
        const donations = await Donation.find({ ngo: { _id: req.user._id }, status: "Donated" })
            .populate({ path: "resto" }).populate({ path: "ngo" }).populate({path: "review"})
        console.log(donations)
        res.render('ngo/ngo_pastorders', { donations })
    })
    .post(async(req,res)=>{
        const donation = await Donation.findOne({ _id: req.body.id , status: "Donated"})
        .populate({ path: "resto" }).populate({ path: "ngo" })
        console.log(donation)
        if(!donation.review)
        {
            const review = new Review(req.body.review)
            review.author = req.user._id
            await review.save()
            donation.review = review._id
            await donation.save()
            res.redirect("/ngo/pastOrders")
        }
        else{
            req.flash("error","Cannot enter more than 1 review/donation")
            res.redirect("/ngo/pastOrders")
        }
    })

router.route("/profile")
    .get((req, res) => {
        res.render('ngo/ngo_profile')
    })

router.route("/currentPickup")
    .get(async (req, res) => {
        if (req.user.isAccepted == "yes") {
            const donation = await Donation
                .findOne({ status: "Accepted", ngo: { _id: req.user._id } })
                .populate({ path: 'resto' }).populate({ path: 'ngo' })
            console.log(donation)
            const geoData = await geoCoder.forwardGeocode({
                query: "Andheri",
                limit: 1
            }).send()
            const c = geoData.body.features[0].geometry.coordinates
            res.render('ngo/ngo_current', { donation })
        }
        else {

            req.flash("error", "No current pickups!")
            res.redirect("/ngo/donations")
        }
    })


router.route("/addRequest")
    .get((req, res) => {
        res.render('ngo/ngo_addrequest')
    })

router.route("/isAccep")
    .get(async (req, res) => {
        await User.findOneAndUpdate({ _id: req.user._id }, { $set: { isAccepted: "no" } }, { overwrite: false, new: true })
        res.redirect("/ngo")
    })

module.exports = router;