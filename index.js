const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 2000;

// middleware
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_PASS);
console.log(process.env.DB_PASS);



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uxvdig6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const roomCollection = client.db('roomData').collection('room');

        app.get('/room', async (req, res) => {
            const cursor = roomCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/room/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            // const options = {
            //     projection: { RoomDescription: 1, PricePerNight: 1, RoomSize: 1, RoomImages: 1, Availability: 1, SpecialOffers: 1 }
            // }

            const result = await roomCollection.findOne(query);
            res.send(result);
        })

        // app.get('/room/:Availability', async (req, res) => {
        //     console.log(req.params.Availability);
        //     const availability = req.query.availability || 'Available';

        //     const cursor = roomCollection.find({ Availability: 'Available' });
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })

        // app.get('/room', async (req, res) => {
        //     const{Availability}=req.query;
        //     let filter={};

        //     if()



        //         console.log(req.params.Availability);
        //     const result = await roomCollection.find({ Availability: req.params.Availability })
        //     res.send(result);
        // })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('hotel server is running')
})

app.listen(port, () => {
    console.log(`Hotel Booking Server is running on port${port}`);
})