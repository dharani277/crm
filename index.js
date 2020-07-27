const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const objectID = mongodb.ObjectID;

const dbURL = "mongodb://127.0.0.1:27017";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("your app is running in", port));

app.get("/", (req, res) => {
  res.send("<h1>Simple CRM form app..! </h1>");
});

app.post("/register", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("crm");
    db.collection("admin").findOne({ email: req.body.email }, (err, data) => {
      if (err) throw err;
      if (data) {
        res.status(400).json({ message: "Email already exists..!!" });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, cryptPassword) => {
            if (err) throw err;
            req.body.password = cryptPassword;
            db.collection("admin").insertOne(req.body, (err, result) => {
              if (err) throw err;
              client.close();
              res.status(200).json({ message: "Registration successful..!! " });
            });
          });
        });
      }
    });
  });
});

app.post("/login", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    client
      .db("crm")
      .collection("admin")
      .findOne({ email: req.body.email }, (err, data) => {
        if (err) throw err;
        if (data) {
          bcrypt.compare(req.body.password, data.password, (err, validUser) => {
            if (err) throw err;
            if (validUser) {
              jwt.sign(
                {
                  userId: data._id,
                },
                "az5PyZ28rSGgBgae",
                { expiresIn: "1h" },
                (err, token) => {
                  res.status(200).json({ message: "Login success..!!", token });
                }
              );
            } else {
              res
                .status(403)
                .json({ message: "Bad Credentials, Login unsuccessful..!!" });
            }
          });
        } else {
          res.status(401).json({
            message: "Email is not registered, Kindly register..!!",
          });
        }
      });
  });
});

app.get("/admin", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("crm");
    db.collection("admin")
      .find()
      .toArray()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(404).json({
          message: "No data Found or some error happen",
          error: err,
        });
      });
  });
});

app.get("/admin/employee", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("crm");
    db.collection("admin")
      .find({ type: "employee" })
      .toArray()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(404).json({
          message: "Details of Employees...!!!",
          error: err,
        });
      });
  });
});

app.get("/admin/manager", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("crm");
    db.collection("admin")
      .find({ type: "manager" })
      .toArray()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(404).json({
          message: "Details of Managers...!!!",
          error: err,
        });
      });
  });
});

app.delete("/user/:id", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    client
      .db("crm")
      .collection("admin")
      .deleteOne({ _id: objectID(req.params.id) }, (err, data) => {
        if (err) throw err;
        client.close();
        res.status(200).json({
          message: "User deleted...!!!",
        });
      });
  });
});

app.put("/admin/employee/:first_name", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    client
      .db("crm")
      .collection("admin")
      .updateOne(
        { $and: [{ first_name: req.params.first_name }, { type: "employee" }] },
        {
          $set: {
            valid: "true",
          },
        }
      )
      .then((data) => {
        console.log("User data update successfully..!!");
        client.close();
        res.status(200).json({
          message: "User data updated..!!",
        });
      });
  });
});

app.put("/admin/manager/:first_name", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    client
      .db("crm")
      .collection("admin")
      .updateOne(
        { $and: [{ first_name: req.params.first_name }, { type: "manager" }] },
        {
          $set: {
            valid: "true",
          },
        }
      )
      .then((data) => {
        console.log("User data update successfully..!!");
        client.close();
        res.status(200).json({
          message: "User data updated..!!",
        });
      });
  });
});

app.post("/customer", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    client
      .db("services")
      .collection("request")
      .insert(req.body, (err, data) => {
        if (err) throw err;
        client.close();
        console.log("Request are added successfully");
        res.status(200).json({
          message: "Data Added...!!!",
        });
      });
  });
});

app.get("/customer/update", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("services");
    db.collection("request")
      .find()
      .toArray()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(404).json({
          message: "Details of Customer...!!!",
          error: err,
        });
      });
  });
});

app.get("/employee/view", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    let db = client.db("services");
    db.collection("request")
      .find()
      .toArray()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res.status(404).json({
          message: "No data Found or some error happen",
          error: err,
        });
      });
  });
});

app.put("/employee/edit/:customer_name", (req, res) => {
  mongoClient.connect(dbURL, (err, client) => {
    if (err) throw err;
    client
      .db("services")
      .collection("request")
      .updateOne(
        {
          $and: [
            { customer_name: req.params.customer_name },
            { type: "manager" },
          ],
        },
        {
          $set: {
            status: "In Process",
          },
        }
      )
      .then((data) => {
        console.log("User data update successfully..!!");
        client.close();
        res.status(200).json({
          message: "User data updated..!!",
        });
      });
  });
});

app.get("/home", authenticatedUsers, (req, res) => {
  res
    .status(200)
    .json({ message: "Only Authenticated users can see this message..!!!" });
});

function authenticatedUsers(req, res, next) {
  if (req.headers.authorization == undefined) {
    res.status(401).json({
      message: "No token available in headers",
    });
  } else {
    jwt.verify(
      req.headers.authorization,
      "az5PyZ28rSGgBgae",
      (err, decodedString) => {
        if (decodedString == undefined) {
          res.status(401).json({ message: "Invalid Token" });
        } else {
          console.log(decodedString);
          next();
        }
      }
    );
  }
}
