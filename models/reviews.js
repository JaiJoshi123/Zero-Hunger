const mongoose= require("mongoose")
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    body:String,
    rating:Number,
    count:Number,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
})

module.exports = mongoose.model("review", reviewSchema)