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

    const volunteerApplicationCollection = client.db('volunteer_management').collection
    ('teem_application');

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

  // add post api DABBLE TAKLO FOLLOW
    // app.post('/volunteer-needs-now', async (req, res) => {
    //  try {
    //   const newPost = req.body; 
    //   const result = await volunteerCollection.insertOne(newPost); 
    //   res.status(201).json({ message: 'Volunteer post added successfully!', data: result });
    //  } catch (error) {
    //   console.error('Error saving volunteer post:', error);
    //   res.status(500).json({ message: 'Failed to add volunteer post.' });
    //   }
    //  });

    // volunteer application get
    app.get('/volunteer-needs-application', async (req, res) => {
      const email = req.query.email;
      const query = {organizerEmail: email}
      const result = await  volunteerApplicationCollection.find().toArray(query);

      res.send(result);
    });


       // volunteer application post
    app.post('/volunteer-needs-application', async (req, res) => { 
      const application = req.body; 
      const result = await volunteerApplicationCollection.insertOne(application); 
      res.send(result)
    
     });


          // Route to fetch post details
      app.get("/volunteer/:postId", async (req, res) => {
        try {
          const post = await volunteerCollection.findById(req.params.postId);
          if (!post) {
            return res.status(404).json({ message: "Post not found" });
          }
          res.json(post);
        } catch (err) {
          res.status(500).json({ message: "Error fetching post details" });
        }
      });
      //     // Route to handle volunteer request submission
    //   // volunteer-requests api
     app.post("/volunteer-needs-application/:id", async(req, res)=>{
      const data = req.body;
      const result = await volunteerApplicationCollection.insertOne(data)
      res.send(result)
     })


    // My Volunteer Need Post
     app.get('/volunteerNeed/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const posts = await volunteerCollection.find({ userId, type: 'volunteerNeed' }); 
          res.json(posts);
        } catch (error) {
          res.status(500).json({ message: "Error fetching posts" });
        }
      });

      // My Volunteer Request Post
      app.get('/volunteerRequest/:userId', async (req, res) => {
        const { userId } = req.params;
        try {
          const posts = await volunteerCollection.find({ userId, type: 'volunteerRequest' }); 
          res.json(posts);
        } catch (error) {
          res.status(500).json({ message: "Error fetching posts" });
        }
      });

      // manage get api
        app.get('/volunteer-needs', async(req, res)=>{
          try {
            const posts = await VolunteerPost.find();
            res.json(posts);
          } catch (error) {
            res.status(500).json({ error: 'Error fetching posts' });
          }
        })

       
        // app.delete('/volunteer-needs/:id', async (req, res) => {
        //   try {
        //     const postId = req.params.id;
        //     await VolunteerPost.findByIdAndDelete(postId);
        //     res.json({ message: 'Post deleted successfully' });
        //   } catch (error) {
        //     res.status(500).json({ error: 'Error deleting post' });
        //   }
        // });


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