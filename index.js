const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 2000;

// middleware
app.use(cors({
    origin: ["http://localhost:5173",
        "https://hotel-booking-dd669.web.app",
        'https://hotel-booking-dd669.firebaseapp.com'
    ]
}));
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
        // await client.connect();


        const roomCollection = client.db('roomData').collection('room');
        const bookingCollection = client.db('roomData').collection('bookings');

        // auth related api
        // app.post('/jwt', async (req, res) => {
        //     const user = req.body;
        //     console.log(user);
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
        //         { expiresIn: '1h' })
        //     // res.send(token);
        //     // res.send(user);

        //     res
        //         .cookie('token', token, {
        //             httpOnly: true,
        //             secure: false, //http://localhost:5173/login,
        //             // maxAge:,
        //             // sameSite: 'none'
        //         })
        //         .send({ success: true })
        // })



        // services 
        // ---------------------------------------------------------------------
        // app.get('/room', async (req, res) => {
        //     const cursor = roomCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })


        app.get('/room', async (req, res) => {
            const { minPrice, maxPrice } = req.query;

            // Create a filter object based on the price range
            const priceFilter = {};
            if (minPrice && maxPrice) {
                priceFilter.PricePerNight = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
            } else if (minPrice) {
                priceFilter.PricePerNight = { $gte: parseInt(minPrice) };
            } else if (maxPrice) {
                priceFilter.PricePerNight = { $lte: parseInt(maxPrice) };
            }

            // Fetch rooms based on the price filter
            const cursor = roomCollection.find(priceFilter);
            const result = await cursor.toArray();
            res.send(result);
        })


        // app.get('/room', async (req, res) => {
        //     const { minPrice, maxPrice } = req.query;

        //     const priceFilter = {};
        //     if (minPrice && maxPrice) {
        //         priceFilter.PricePerNight = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
        //     } else if (minPrice) {
        //         priceFilter.PricePerNight = { $gte: parseInt(minPrice) };
        //     } else if (maxPrice) {
        //         priceFilter.PricePerNight = { $lte: parseInt(maxPrice) };
        //     }

        //     const cursor = roomCollection.find(priceFilter);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // });


        // ----------------------------------------------------------------------

        app.get('/room/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            // const options = {
            //     projection: { RoomDescription: 1, PricePerNight: 1, RoomSize: 1, RoomImages: 1, Availability: 1, SpecialOffers: 1 }
            // }

            const result = await roomCollection.findOne(query);
            res.send(result);
        })


        //-----------------------------------------------------------------
        // app.get('/room', async (req, res) => {
        //     console.log(req.query.Availability);
        //     // const { Availability } = req.query;
        //     let query = {};
        //     if (req.query?.Availability) {
        //         query = { Availability: req.query.Available }
        //     }
        //     const result = await roomCollection.find(query).toArray();
        //     res.send(result);
        // })
        //----------------------------------------------------------------


        // bookings 
        app.get('/bookings', async (req, res) => {
            console.log(req.query.email);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })
        // --------------------------------------------------------------------------------
        // app.post('/bookings', async (req, res) => {
        //     const booking = req.body;
        //     console.log(booking);
        //     const result = await bookingCollection.insertOne(booking);
        //     res.send(result);
        // })


        app.post('/bookings', (req, res) => {
            const booking = req.body;
            const roomId = booking.booking;

            // Insert the booking into the booking collection
            bookingCollection.insertOne(booking)
                .then(bookingResult => {
                    if (bookingResult.insertedId) {
                        // Update the room availability to "unavailable"
                        return roomCollection.updateOne(
                            { _id: new ObjectId(roomId) },
                            { $set: { Availability: 'unavailable' } }
                        ).then(roomResult => {
                            if (roomResult.modifiedCount > 0) {
                                res.status(200).json({ success: true, message: 'Booking and room update successful', insertedId: bookingResult.insertedId });
                            } else {
                                res.status(500).json({ success: false, message: 'Booking successful but failed to update room availability' });
                            }
                        });
                    } else {
                        res.status(500).json({ success: false, message: 'Failed to create booking' });
                    }
                })
                .catch(error => {
                    res.status(500).json({ success: false, message: 'An error occurred', error });
                });
        });

        // ---------------------------------------------------------------------------------

        // ---------------------------------------------------------------
        // Update a bid status
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id
            const Availability = req.body
            const query = { _id: new ObjectId(id) }
            const UpdateDoc = {
                $set: Availability,
            }
            const result = await bookingCollection.updateOne(query, UpdateDoc)
            res.send(result)
        })
        // ---------------------------------------------------------------

        // Update Mybooking page
        app.put('/bookinges/:bookingId', async (req, res) => {
            const bookingId = req.params.bookingId;

            const newDate = req.body.newDate;
            console.log(bookingId, newDate);
            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(bookingId) },
                { $set: { date: newDate } }
            );
            res.json(result);
        });

        // review--------------------------------------------
        // review--------------------------------------------
        app.post('/reviews', async (req, res) => {
            try {
                const { username, room, rating, comment } = req.body;
                // Save the review to the database
                const review = {
                    username,
                    room: ObjectId(room), // Convert room ID to ObjectId
                    rating,
                    comment,
                    timestamp: new Date()
                };
                const result = await db.collection('reviews').insertOne(review);
                res.status(201).json(result.ops[0]); // Return the inserted review
            } catch (error) {
                res.status(500).json({ message: 'Failed to post review', error });
            }
        });

        // Endpoint for fetching reviews for a specific room
        app.get('/reviews/:roomId', async (req, res) => {
            try {
                const roomId = req.params.roomId;
                // Fetch reviews for the specified room from the database
                const reviews = await db.collection('reviews').find({ room: ObjectId(roomId) }).toArray();
                res.status(200).json(reviews);
            } catch (error) {
                res.status(500).json({ message: 'Failed to fetch reviews', error });
            }
        });


        // -------------------------------------------------------------------


        // ------------------------------------------------------------------------
        // app.delete('/bookings/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await bookingCollection.deleteOne(query);
        //     res.send(result);
        // })



        // Delete booking and update room availability
        app.delete('/bookings/:id', (req, res) => {
            const bookingId = req.params.id;

            // Find the booking by ID to get the associated room ID
            bookingCollection.findOne({ _id: new ObjectId(bookingId) })
                .then(booking => {
                    if (booking) {
                        const roomId = booking.booking;

                        // Delete the booking
                        bookingCollection.deleteOne({ _id: new ObjectId(bookingId) })
                            .then(deleteResult => {
                                if (deleteResult.deletedCount > 0) {
                                    // Update the room's availability to 'available'
                                    roomCollection.updateOne(
                                        { _id: new ObjectId(roomId) },
                                        { $set: { Availability: 'available' } }
                                    ).then(updateResult => {
                                        if (updateResult.modifiedCount > 0) {
                                            res.status(200).json({ success: true, message: 'Booking deleted and room availability updated' });
                                        } else {
                                            res.status(500).json({ success: false, message: 'Booking deleted but failed to update room availability' });
                                        }
                                    });
                                } else {
                                    res.status(500).json({ success: false, message: 'Failed to delete booking' });
                                }
                            });
                    } else {
                        res.status(404).json({ success: false, message: 'Booking not found' });
                    }
                })
                .catch(error => {
                    res.status(500).json({ success: false, message: 'An error occurred', error });
                });
        });



        // ------------------------------------------------------------

        // app.get('/room/:Availability', async (req, res) => {
        //     console.log(req.params.Availability);
        //     const availability = req.query.availability || 'Available';

        //     const cursor = roomCollection.find({ Availability: 'Available' });
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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