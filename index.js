require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors')

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASSWORD}@atlascluster.ahdqck1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const doctorsCollection = client.db('doctorsCollection').collection('doctors');
        const bookingsCollection = client.db('bookingCollection').collection('bookings');
        const prescriptionCollection = client.db('prescriptions').collection('prescription')
      


        // //   get user specific booking appointments
        app.get('/bookings', async (req, res) =>{
            const query = {}
            const result = await bookingsCollection.find(query).toArray();

            res.send(result);
        })

        //booking appointment
        app.post('/bookings', async(req, res) =>{
            const data = req.body;
            const query = {
                specialist: data.specialist
            }
            const booked = await bookingsCollection.find(query).toArray();
            if(booked.length){
                const message=`You already booked on ${data.specialist} please try another one`
                return res.send({acknowledged: false, message})
            }
            const result = await bookingsCollection.insertOne(data);
            

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


        // get all doctors
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