require("dotenv").config()

const express = require("express")
const app = express();
const path = require('path')
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate")
//const joi = require("joi")
const session= require("express-session")
const passport = require('passport')
const localStrategy =require("passport-local")
const flash = require("connect-flash");
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');



const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/expressError");
//const { campgroundSchema, reviewSchema }= require("./schemas.js")
const authRoutes = require("./routes/auth");
const ngoRoutes =require("./routes/ngo")
const restoRoutes =require("./routes/resto")
const User = require("./models/user");

//const upload=require("express-fileupload");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/zero_hunger";
mongoose.connect(dbUrl,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("MONGOOSE CONNECTED")
});

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//app.use(upload())
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))
app.use(flash());
app.use(mongoSanitize({
   replaceWith: ' '
 }));

const secret = process.env.SECRET || "lolnoobsecret";

const sessionConfig = {
    store: MongoStore.create({ 
        mongoUrl: process.env.DB_URL,
        secret,
        touchAfter: 24*3600}),
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
} 
app.use(session(sessionConfig))


app.use(passport.initialize())
app.use(passport.session());

require('./passport_config');

app.use((req,res,next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
})

app.use('/auth',authRoutes);
app.use('/ngo', ngoRoutes);
app.use('/resto', restoRoutes);


app.get('/', (req, res) => {
    res.render('home/index');
})

app.get('/about', (req, res) => {
    res.render('home/about');
})

app.get('/contact', (req, res) => {
    res.render('home/contact');
})

app.get('/blog', (req, res) => {
    res.render('home/blog');
})

app.all("*", (req, res, next) => {
     next(new ExpressError("Page not found", 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
     if (!err.message) err.message = "something went wrong";
     res.status(statusCode).render("error", { err });
})

const port = 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
})