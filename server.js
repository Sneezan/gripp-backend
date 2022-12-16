import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import data from "./data/card-statements.json";
import { UserSchema } from './models/User'
import { StatementSchema } from './models/Statements'
import { getRandomInt } from "./utils/utils";

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


// Start defining your routes here
app.get("/", (req, res) => {
  res.status(200).json({
    Hello: "Gripp: a party game! Here are the routes",
    Routes: [
      { "POST /register": "Register an account" },
      { "POST /login": "Login with password & username" },
      { "GET /profile": "Authenticated users profile, add key & accesstoken" },

      { "GET /statements": "All data in json file" },
      { "GET /statements-only": "Get only and all statements" },
      { "GET /random": "get ONE Random statement!" },

      { "GET /statements/levels": "Get statements by levels sorted low-high" },
      { "GET /statements/levels/:level": "Get statements by specific level, like " },
      { "GET /statements/statementId/:statementId": "Get specific level ID" }
    ],
  });
});


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
      const newUser = await new User({
        username: username, 
        password: bcrypt.hashSync(password, salt)
      }).save();

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
          accessToken: user.accessToken,
          userCreatedAt: user.userCreatedAt
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

//  Authentication of user 
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({accessToken: accessToken});
    if (user) {
      next();
    } else {
      res.status(401).json({
        response: "Not authorized, please log in",
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

// authenticate in postman header, key: Authorization, value: accesstoken
app.get("/profile", authenticateUser);
app.get("/profile", async (req, res) => {  
  let profiles = [];
  const loggedInUser = await User.findOne({accessToken: req.header("Authorization")});
  profiles.push(loggedInUser);
  const profile = profiles.map((user, date) => {
    return ({
      username: user.username,
      memberSince: user.userCreatedAt 
    })
  })
  try {
    res.status(200).json({
      success: true,
      response: profile 
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      response: err
    })
  }
});





///////////////////////   STATEMENT ROUTES    //////////////////////////////

//Routes for the statements gets all the data in the API
  const Statements = mongoose.model("Statement", StatementSchema);
  app.get("/statements", async (req, res) => {
    const allStatementData = await Statements.find({})
    res.status(200).json({
      success: true,
      body: allStatementData
    })
  });
 
  // random, gets one random statement 
  app.get("/random", async (req, res) => {
    const allStatementData = await Statements.find({})
    const randomNumber = getRandomInt(0, 7);

    res.status(200).json({
      success: true,
      body: allStatementData[randomNumber].statement
    })
  });
//allStatementData[getRandomInt(0, 7)].statement

// Gets only the statements, all of them
    app.get("/statements-only", (request, respons) => {
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
    

// Sort levels lowest to highest
    app.get('/statements/levels', (req, res) => {
      const { level } = req.params;
      const byLevel = data.sort((a, b) => a.level - b.level)
        res.json(byLevel.slice(0, [-1])) 
    })

// Find specific level, 1-3 
    app.get("/statements/levels/:level", async (req, res) => {
      try {
        const byLevel = await Statements.find({level: req.params.level}).exec();
        if (byLevel) {
          res.status(200).json({
            success: true,
            body: byLevel
          })
        } else {
          res.status(404).json({
            success: false,
            body: {
              message: "Could not find the level"
            }
          })
        }
      } catch(error) {
        res.status(400).json({
          success: false,
          body: {
            message: "Invalid level entered"
          }
        })
      }
    });


// Gets specific statement by id 
    app.get("/statements/statementId/:statementId", async (req, res) => {
      try {
        const byId = await Statements.find({statementId: req.params.statementId}).exec();
        if (byId) {
          res.status(200).json({
            success: true,
            body: byId
          })
        } else {
          res.status(404).json({
            success: false,
            body: {
              message: "Could not find the statement by ID"
            }
          })
        }
      } catch(error) {
        res.status(400).json({
          success: false,
          body: {
            message: "Invalid ID entered"
          }
        })
      }
    });    


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

