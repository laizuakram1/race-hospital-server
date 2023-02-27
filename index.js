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