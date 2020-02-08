//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const passport = require("passport");
const localStrategy= require("passport-local");
const react=require("react");
var passportLocalMongoose=require("passport-local-mongoose");

const app = express();

const postSchema = {
  author:String,
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);
var UserSchema =new mongoose.Schema({
  username: String,
  password: String,
  lover_username:String
});
UserSchema.plugin(passportLocalMongoose);
const User=mongoose.model("User",UserSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(require("express-session")({
secret:"hello",
resave:false,
saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb+srv://admin:test123@cluster0-b4qcr.mongodb.net/keeper",{useNewUrlParser:true});



app.use(function(req,res,next){
  res.locals.currentUser=req.user;
  next();
});

app.get("/", function(req, res){

  if(req.isAuthenticated()){
    Post.find({author:[req.user.lover_username,req.user.username]}, function(err, posts){
      res.render("index", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
  }else{
    Post.find({author:"fake"}, function(err, posts){
      res.render("index", {
        startingContent: homeStartingContent,
        posts: posts
        });
    });
  }

});

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("index");
  }else{
    res.redirect("/login");
  }
});

app.post("/compose", function(req, res){
  const post = new Post({
    author:req.user.username,
    title: req.body.postTitle,
    content: req.body.postBody
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("signup");
});

app.post("/register",function(req,res){
  var newUser = new User({
    username: req.body.username
  });
  User.register(newUser,
  req.body.password,function(err,user){
      if(err){
        console.log(err);
        return res.redirect("/");
      }
      passport.authenticate("local")(req,res,function(){
        res.redirect("/");
      });
  });
});

app.post("/login",passport.authenticate("local",{
  successRedirect:"/",
  failureRedirect:"/login"
}),function(req,res){
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});


app.listen(process.env.PORT||3000, function(){
   console.log("The Server Has Started!");
});
