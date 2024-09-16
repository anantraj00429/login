const express = require("express");
const mongoose = require("mongoose");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const port = process.env.PORT || 3000;

require("./db/conn");
// const register = require("./models/register");

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(static_path));
app.set("view engine", "ejs");
app.set("views", templates_path);

const sessionOptions = {
  secret: "mysupersecretkey",
  resave: false,
  saveUninitialized: false, // Consider changing this to false for better security
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if you're using HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  console.log("Current user:", res.locals.currUser); // Debugging
  res.render("index");
});

app.get("/index", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/secret", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("secret");
  } else {
    return res.render("login", { message: "You must be logged in first" });
  }
});

// app.get("/secret", (req, res) => {
//   if (!req.isAuthenticated()) {
//     // res.send("Welcome to the secret page");
//     return res.redirect("/secret");
//   } else {
//     // res.send("Welcome to the secret page");
//     res.render("login");
//   }
// });

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (err) {
    console.error(err);
    res.redirect("/register");
  }
});

// app.post(
//   "/login",
//   // passport.authenticate("local", {
//   //   failureRedirect: "/index",
//   // }),
//   async (req, res) => {
//     res.send("welcome you are logedin!!!");
//     res.redirect("index");
//   }
// );

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err); // Log any errors during authentication
      return next(err);
    }
    if (!user) {
      console.log("Authentication failed:", info); // Log the reason for authentication failure
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login error:", err); // Log any errors during login
        return next(err);
      }
      console.log("User logged in:", user); // Log successful login.
      console.log("req.user:", req.user);
      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
