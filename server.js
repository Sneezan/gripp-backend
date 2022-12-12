import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import data from "./data/card-statements.json";
import { UserSchema } from './models/User'
import { StatementSchema } from './models/Statements'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/gripp";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// npm i crypto - npm i bcrypt 
// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Mongoose model user 
const User = mongoose.model("User", UserSchema);


// Register  &  login  Endpoints 
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const salt = bcrypt.genSaltSync();
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        response: "Password must be at least 8 characters long"
      });
    } else {
      const newUser = await new User({username: username, password: bcrypt.hashSync(password, salt)}).save();
      res.status(201).json({
        success: true,
        response: {
          username: newUser.username,
          accessToken: newUser.accessToken,
          id: newUser._id
        }
      });
    }
  } catch(error) {
      res.status(400).json({
        success: false,
        response: error
      });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({username});
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          id: user._id,
          accessToken: user.accessToken
        }
      });
    } else {
      res.status(400).json({
        success: false,
        response: "Credentials didn't match"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error
    });
  }
});

const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({accessToken: accessToken});
    if (user) {
      next();
    } else {
      res.status(401).json({
        response: "Please log in",
        success: false
      })
    }
  } catch (error) {
    res.status(400).json({
      response: error,
      success: false
    })
  }
}




//Routes for the statements 
  const Statements = mongoose.model("Statement", StatementSchema);

  app.get('/data', (req, res) => {
    res.status(200).json({
      data: data,
      success: true,
    })
    })
    

    app.get("/statements", (request, respons) => {
      const statementList = data.map((echo) => echo.statement);
    
      if (statementList) {
        respons.status(200).json({ 
          data: statementList, 
          success: true,});
      } else {
        respons.status(200).json({ 
          data: [], 
          success: false,
          message: "Statement can't be found"});
      }
    });
    

    app.get("/statements/id", (request, respons) => {
      const idList = data.map((echo) => echo.statementId);
    
      if (idList) {
        respons.status(200).json({ 
          data: idList, 
          success: true,});
      } else {
        respons.status(200).json({ 
          data: [], 
          success: false,
          message: "Statement can't be found"});
      }
    });
    




// Start defining your routes here
app.get("/", (req, res) => {
  res.status(200).json({
    Hello: "Gripp: a party game! Here are the routes",
    Routes: [
      { "POST /register": "Register an account" },
      { "POST /login": "Login with password & username" },

      { "GET /data": "All data in json file" },
      { "GET /statements": "Get all statements" },
      { "GET /statements/id": "Get all ids" },
    ],
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// deploy link  https://projectauthcecilialinus-lonzreseuq-lz.a.run.app 