require('dotenv').config()
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors')

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASSWORD}@atlascluster.ahdqck1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// jwt verify middleware
const verifyJwtToken = (req, res, next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.accessToken, function(err, decoded){
        if(err){
            return res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try{
        await client.connect();
        const doctorsCollection = client.db('doctorsCollection').collection('doctors');
        const bookingsCollection = client.db('bookingCollection').collection('bookings');
        const prescriptionCollection = client.db('prescriptions').collection('prescription')
        const reportCollection = client.db('reports').collection('report')
        const profileCollection = client.db('profiles').collection('profile')
        const usersCollection = client.db('usersCollection').collection('users')
      
        //payment route start here
        app.post('/create-payment-intent', async(req, res) =>{
            const price = req.body.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount:amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                  ]
              });
            
              res.send({
                clientSecret: paymentIntent.client_secret,
              });
            
        })

        // jwt token issue
        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);

            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN,{ expiresIn: '1d' })
                return res.send({accessToken:token})
            }
            res.status(403).send({accessToken:''})
        }) 


        //   save new users data
        app.post('/users', async(req, res)=>{
            const usersData = req.body;
            const result = await usersCollection.insertOne(usersData);

            res.send(result);
          })

        // //   get user specific all booking appointments(my appointments)
        app.get('/bookings',verifyJwtToken, async (req, res) =>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({message:'unauthorized access'})
            }
            const query = {email:email}
            const result = await bookingsCollection.find(query).toArray();
            if(!result){
                return res.status(400).send({message:'you have not available booking now'})
            }
            res.send(result);
        })

        //booking appointment
        app.post('/bookings', async(req, res) =>{
            const data = req.body;
            const query = {
                specialist: data.specialist,
                email: data.email
            }
            const booked = await bookingsCollection.find(query).toArray();
            if(booked.length){
                const message=`You already booked on ${data.specialist} please try another one`
                return res.send({acknowledged: false, message})
            }
            const result = await bookingsCollection.insertOne(data);
            

            res.send(result);
        });

        //get user specific bookings
        app.get('/bookings/:id', async(req,res) =>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id)}
            const result = await bookingsCollection.findOne(query);

            res.send(result);
        })


        //post prescription image
        app.post('/prescription', async(req, res) =>{
            const data = req.body;
            const result = await prescriptionCollection.insertOne(data);
            

            res.send(result);
        })
        
        //get user specific prescription
        app.get('/prescription', async (req, res) =>{
            const email = req.query.email
            const query = {email:email}
            const prescriptions = await prescriptionCollection.find(query).toArray();

            res.send(prescriptions)
            
        })

        //post user reports
        app.post('/reports', async(req,res) =>{
            const data = req.body;
            const result = await reportCollection.insertOne(data);

            res.send(result)
        })

        //get user specific reports
        app.get('/reports', async (req, res) =>{
            const email = req.query.email
            const query = {email:email}
            const reports = await reportCollection.find(query).toArray();

            res.send(reports)
            
        })

        //update user profile information
        app.post('/profile', async(req, res) =>{
            const data = req.body;
            const result = await profileCollection.insertOne(data);

            res.send(result)
        })

        //get user profile information
        app.get('/profile', async(req, res) =>{
            const query = {};
            const result = await profileCollection.find(query).toArray();

            res.send(result)
        })


        // get all doctors service in appointment page
        app.get('/doctors', async (req, res) => {
            const query = {};
            const result =await doctorsCollection.find(query).toArray();
      
            res.send(result);
          })
  
    }
    finally{
        // await client.close();
    }
}

app.get('/', async(req, res) =>{
    res.send('hello from hospital server');
})

app.listen(port, () =>{
    console.log(`hospital server running on ${port}`)
})
run().catch(console.dir);