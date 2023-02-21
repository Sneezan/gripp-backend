import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { UserSchema } from './models/User'
import { StatementSchema } from './models/Statements'
import { getRandomInt } from "./utils/utils";
import { format } from "date-fns";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/gripp";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

const User = mongoose.model("User", UserSchema);

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
  const { username, password, email } = req.body;

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
        email: email.toLowerCase(), 
        password: bcrypt.hashSync(password, salt)
      }).save();

      res.status(201).json({
        success: true,
        response: {
          username: newUser.username,
          email: newUser.email,
          accessToken: newUser.accessToken,
          userCreatedAt: newUser.userCreatedAt,
          id: newUser._id
        }
      });
    }
  }  catch (error) {
    const emailExists = await User.findOne({ email })
    if (email === '') {
      res.status(400).json({
        response: 'Please enter an email',
        error: error,
        success: false,
      })
    } else if (emailExists) {
      res.status(400).json({
        response: 'Seems like this email has been used before',
        success: false,
      })
    } else if (error.code === 11000 && error.keyPattern.email) {
      res.status(400).json({
        response: 'User already exists',
        error: error,
        success: false,
      })
    } else {
      res.status(400).json({
        response: error,
        success: false, 
      });
  }
}});

app.post("/login", async (req, res) => {
  const { password, email } = req.body;

  try {
    const user = await User.findOne({email});
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          email: user.email,
          id: user._id,
          accessToken: user.accessToken,
          userCreatedAt: user.userCreatedAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        response: "Credentials didn't match - we can't find the user"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      response: "error"
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
  const profile = profiles.map((user) => {
    return ({
      username: user.username,
      userCreatedAt: user.userCreatedAt
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
  // RESET_DB=true npm run dev for MongoCompass
if(process.env.RESET_DB) {
  const resetDataBase = async () => {
    await Statements.deleteMany();
    data.forEach(singleStatement => {
      const newStatement = new Statements(singleStatement);
      newStatement.save();
    })
  }
  resetDataBase();
}


  app.get("/statements", async (req, res) => {
    const allStatementData = await Statements.find({})
    if (allStatementData) {
       res.status(200).json({
         success: true,
         body: allStatementData.sort(() => Math.random() - 0.5)}); 
       } else {
           res.status(404).json({
             success: false,
             body: {
               message: "Could not randomize statement"
             }
           })
         }
    });
    
 
  // random, gets one random statement 
  app.get("/random", async (req, res) => {
    const randomStatement = await Statements.find({})
    const randomNumber = getRandomInt(0, 7);
if (randomStatement) {
    res.status(200).json({
      success: true,
      body: randomStatement[randomNumber].statement}); 
    } else {
        res.status(404).json({
          success: false,
          body: {
            message: "Could not randomize statement"
          }
        })
      }
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

