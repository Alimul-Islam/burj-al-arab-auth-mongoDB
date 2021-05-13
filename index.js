const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vw11.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 4000;


const app = express()
app.use(cors());
app.use(bodyParser.json());
const serviceAccount = require("./configs/burj-al-arab-auth-f95a9-firebase-adminsdk-dogkb-4200d33ca8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)

});



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  console.log("Database Connected Successfully")

  app.post('/addBookings', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        //  console.log(result)
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail)
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized Access')

        });
    }
    else {
      res.status(401).send('Unauthorized Access')
    }
  })
});

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port)