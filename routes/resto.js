const router = require('express').Router();
const User = require('../models/user');
const Donation = require('../models/donation');

const {storage} = require("../cloudinary") //node automatically searches for index file
const multer = require("multer")
const upload = multer({ storage })
//const upload = multer({ dest: 'uploads/' })


router.route("/")
    .get(async(req,res)=>{
        
        //console.log(count)
        res.redirect('/resto/profile')
    })
router.route("/addDonation")
    .get((req,res)=>{
        res.render('resto/resto_addorder')
    })
    .post(upload.single('image'),async (req,res)=>{
        const donation = new Donation(req.body.donation);
        donation.status = "Available"
        donation.resto = req.user._id
        donation.dateUpload = new Date()
        donation.img.url=req.file.path
        donation.img.filename=req.file.filename
        await donation.save()
        console.log(donation)
        req.flash("success","Posted donation successfully")
        res.redirect('/resto/profile')
    })

router.route("/currentDonations")
    .get(async(req,res)=>{
        const donations = await Donation.find({ resto: { _id: req.user._id } }).populate({path: 'resto'}).populate({path: 'ngo'})
        console.log(donations)
        res.render('resto/resto_current', {donations})
    })

router.route("/profile")
    .get(async(req,res)=>{
        var rating=0
        const count = await Donation.countDocuments({ resto:{ _id: req.user._id}, status: "Donated"})
        const donations = await Donation.find({resto:{_id: req.user._id}}).populate({path: "review"})
        for(let d of donations){
            if(d.review){
                rating+=d.review.rating
            }
            
        }
        rating = Math.floor(rating/count)
        const user = await User.findById(req.user._id)
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
        if(rating){
            user.resto.rating=rating
        }else{
            user.resto.rating=0
        }
        
        await user.save()
        console.log(user.resto.rating,count)
        res.render('resto/resto_profile',{count})
    })

router.route("/previousDonations")
    .get(async(req,res)=>{
        const donations = await Donation.find({ resto: { _id: req.user._id}, status: "Donated"})
                          .populate({path: "resto"}).populate({path: "ngo"}).populate({path: "review"})
        res.render('resto/resto_pastorder',{donations})
    })
module.exports = router;