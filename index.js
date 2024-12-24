const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 9000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());


const uri=`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5di9a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)
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

    const db = client.db('volunteer_management')
    const volunteerCollection = db.collection('teem')


    app.get('/volunteer-needs-now', async (req, res) => {
      try {
        const result = await volunteerCollection
          .find()
          .sort({ deadline: 1 }) 
          .limit(6) 
          .toArray();
    
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch upcoming volunteer posts' });
      }
    });
   
   // Get all posts
   app.get('/all-volunteer-posts', async (req, res) => {
    const posts = await volunteerCollection.find({}).sort({ deadline: 1 }).toArray();
    res.send(posts);
  });

  
   // Get id 
    app.get("/volunteer/:id", async (req, res) => {
      const { id } = req.params;
      try {
          const post = await volunteerCollection.findOne({ _id: new ObjectId(id) });
          if (!post) {
              return res.status(404).json({ message: "Post not found" });
          }
          res.json(post);
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Error fetching post" });
      }
  });

  // add post api
  app.post('/volunteer-needs-now', async (req, res) => {
    try {
      const newPost = req.body; // Get data from the request body
      const result = await volunteerCollection.insertOne(newPost); 
      res.status(201).json({ message: 'Volunteer post added successfully!', data: result });
    } catch (error) {
      console.error('Error saving volunteer post:', error);
      res.status(500).json({ message: 'Failed to add volunteer post.' });
    }
  });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Empowering Volunteers,Transforming Lives')
})

app.listen(port,() =>{
    console.log(`Empowering Volunteers,Transforming Lives at: ${port}`)
})