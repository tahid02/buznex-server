const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { ObjectID } = require("mongodb");
const checkLogin = require("./middleware/checkLogin");
const MongoClient = require("mongodb").MongoClient;

//const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z6ers.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
// some space problem at .env file. so hard coded it next line
const uri = `mongodb+srv://buznexUser:buznexPass@cluster0.z6ers.mongodb.net/buznexDB?retryWrites=true&w=majority`;
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser(process.env.SECRET_KEY));

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const buznexUserCollection = client
    .db("buznexDB")
    .collection("buznexCollection");
  console.log("database connected");

  // perform actions on the collection object
  //                                                            STEP  1: signup the user

  app.post("/signup", async (req, res) => {
    try {
      console.log(req.body);
      const { name, email, number, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      // console.log('adding new services: ', newServices)
      const userData = {
        name,
        email,
        number,
        password: hashedPassword,
        age: "",
        gender: "",
      };
      await buznexUserCollection.insertOne(userData);
      res.status(200).json({
        message: `user signup successful `,
      });
    } catch (error) {
      res.status(500).json({
        message: `user post error ${error}`,
      });
      console.log(error);
    }
  });

  //                                                                 ////   STEP 2

  // as now user is registered . he\she can login using email and password
  app.post("/login", async (req, res) => {
    try {
      console.log(req.body);
      const user = await buznexUserCollection
        .find({
          email: req.body.email,
        })
        .toArray();
      //  console.log(user[0]);
      if (user && user.length) {
        const isPasswordValid = await bcrypt.compare(
          req.body.password,
          user[0].password
        );

        //   token created
        if (isPasswordValid) {
          console.log("pass valid plus", " user is", user[0]);
          const token = jwt.sign(
            {
              name: user[0].name,
              number: user[0].number,
            },
            process.env.JWT_SECRET_KEY,
            {
              expiresIn: "1h",
            }
          );
          console.log({ token });

          ////// token is set  in browser cookie
          res.cookie(process.env.COOKIE_NAME, token, {
            maxAge: 3200,
            httpOnly: true,
            signed: true, // cookie will be encrypted
          });
          res.status(200).json({
            access_token: token,
            userData: user,
            message: "login successful ",
          });
        } else {
          console.log("here 1");
          res.status(401).json({
            error: `authentication failed 1`,
          });
        }
      } else {
        console.log("here 2");
        res.status(401).json({
          error: `authentication failed 2`,
        });
      }
    } catch (error) {
      console.log("here 3", error);
      res.status(401).json({
        error: `authentication failed 3 ${error}`,
      });
    }
  });

  //                                                                        /////       STEP 3
  ///// after logged in . user can view his\her profile
  app.get("/profile/:id", async (req, res) => {
    try {
      const id = ObjectID(req.params.id);
      const user = await buznexUserCollection.find({ _id: id }).toArray();
      res.status(200).json({
        userData: user,
        message: "login successful ",
      });
    } catch (error) {
      console.log("profile", error);
      res.status(401).json({
        error: "profile fetch failed",
      });
    }
  });

  //                                                                             ////      STEP 4:
  ///// update profile
  app.patch("/update/:id", checkLogin, (req, res) => {
    console.log(req.body);
    const { gender, age } = req.body;

    buznexUserCollection
      .updateOne(
        { _id: ObjectID(req.params.id) },
        {
          $set: { gender, age },
        }
      )
      .then((result) => {
        console.log(result);
        res.send(result.modifiedCount > 0);
      })
      .catch((err) => console.log(err));
  });
  //   client.close();
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
