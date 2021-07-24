const mongoose = require('mongoose');
const moment = require("moment")


const DonationSchema = new mongoose.Schema({
    ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    resto:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    foodName: {
        type: String
    },
    dateUpload: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: String,
        default: 'Available',
        enum: ["Available","Accepted","Donated","Expired"]
    },
    quantity: {
        type: Number
    },
    img: {
        url: {type: String},
        filename: {type: String}
    },
    food: {
        type: String
    },
    availTill: {
        type: Date
    },
    receivedOn: {
        type: Date
    },
    spoc:String,
    spoc_no:Number,
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'review'
    }
});

DonationSchema.virtual('getUploadTime').get(function() {
    const date = this.dateUpload
    const Year = date.getFullYear()
    const hh = date.getHours()
    var mm = date.getMinutes()
    const month = new Intl.DateTimeFormat('en-US', {month: "long"}).format(date)
    const day = date.getDate()
    if(mm=="0"){
        mm="00"
    }
    if(hh>="12")
	{
		var a="PM"
	}
	else{
		var a="AM"
	}
    return `${month} ${day}, ${Year}, ${hh}:${mm} ${a}`
})

DonationSchema.virtual('getAvailTime').get(function() {
    const date = this.availTill
    const Year = date.getFullYear()
    const hh = date.getHours()
    var mm = date.getMinutes()
    const month = new Intl.DateTimeFormat('en-US', {month: "long"}).format(date)
    const day = date.getDate()
    if(mm=="0"){
        mm="00"
    }
    if(hh>="12")
	{
		var a="PM"
	}
	else{
		var a="AM"
	}
    return `${month} ${day}, ${Year}, ${hh}:${mm} ${a}`
})

DonationSchema.virtual('getRecTime').get(function() {
    const date = this.receivedOn
    const Year = date.getFullYear()
    const hh = date.getHours()
    var mm = date.getMinutes()
    const month = new Intl.DateTimeFormat('en-US', {month: "long"}).format(date)
    const day = date.getDate()
    if(mm=="0"){
        mm="00"
    }
    if(hh>="12")
	{
		var a="PM"
	}
	else{
		var a="AM"
	}
    return `${month} ${day}, ${Year}, ${hh}:${mm} ${a}`
})

DonationSchema.pre('save', async function (next) {
    try {
      if (this.isNew) {
        this.availTill =new Date(new Date(this.dateUpload).getTime() + 60 * 60 * 24 * 1000);
        console.log(this.availTill)
      }
      next();
    } catch (error) {
      next(error);
    }
  });

const Donation = mongoose.model('donation', DonationSchema);
module.exports = Donation;