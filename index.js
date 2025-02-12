const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 9000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5di9a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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

    const db = client.db('volunteer_management');
    const volunteerCollection = db.collection('teem');
    const volunteerApplicationCollection = db.collection('applications');


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
    app.get('/volunteer/:id', async (req, res) => {
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

    // volunteer application get
    app.get('/volunteer-needs-application', async (req, res) => {
      const email = req.query.email;
      const query = { organizerEmail: email }
      const result = await volunteerApplicationCollection.find(query).toArray();

      res.send(result);
    });


    // volunteer application post
    app.post('/volunteer-needs-application', async (req, res) => {
      const application = req.body;
      const result = await volunteerApplicationCollection.insertOne(application);
      res.send(result)

    });


    // Route to fetch post details
    app.get("/volunteer-needs-application/:postId", async (req, res) => {
      try {
        const post = await volunteerApplicationCollection.findById(req.params.postId);
        if (!post) {
          return res.status(404).json({ message: "Post not found" });
        }
        res.json(post);
      } catch (err) {
        res.status(500).json({ message: "Error fetching post details" });
      }
    });

    app.get("/volunteer-needs-now/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Received ID:", id);
      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }

        const objectId = new ObjectId(id);
        const post = await volunteerCollection.findOne({ _id: objectId });

        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        res.json(post);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post('/volunteer-needs-now/:id', async (req, res) => {
      const { id } = req.params;
      const volunteerData = req.body;
  
      console.log("Received volunteer data:", volunteerData);
  
      try {
          if (!ObjectId.isValid(id)) {
              return res.status(400).json({ success: false, message: "Invalid ID format" });
          }
  
          const objectId = new ObjectId(id);
  
          // Insert volunteer data into the database
          const result = await volunteerCollection.insertOne({
              ...volunteerData,
              postId: objectId 
          });
  
          if (result.insertedId) {
              // Update the number of volunteers needed by 1
              const updateResult = await volunteerCollection.updateOne(
                  { _id: objectId },
                  { $inc: { volunteersNeeded: -1 } } 
              );
  
              const updatedPost = await volunteerCollection.findOne({ _id: objectId });
  
              console.log("Updated post data:", updatedPost);
  
              if (updateResult.modifiedCount > 0) {
                const updatedPost = await volunteerCollection.findOne({ _id: objectId });
                console.log("Updated post after decrement:", updatedPost.volunteersNeeded);
                  res.send({ success: true, message: "Volunteer request submitted and volunteers count updated!" });
              } else {
                  res.send({ success: false, message: "Volunteer count update failed." });
              }
          } else {
              res.send({ success: false, message: "Failed to submit request." });
          }
      } catch (error) {
          console.error("Error submitting volunteer request:", error);
          res.status(500).send({ success: false, message: "Server error!" });
      }
  });

    // My Volunteer Need Post
    app.get('/volunteerNeed/:userId', async (req, res) => {
      const { userId } = req.params;
      const posts = await volunteerCollection.find({ userId, type: 'volunteerNeed' }).toArray();
      res.json(posts);
    });

    // My Volunteer Request Post
    app.get('/volunteerRequest/:userId', async (req, res) => {
      const { userId } = req.params;
      const posts = await volunteerCollection.find({ userId, type: 'volunteerRequest' }).toArray();
      res.json(posts);
    });
    // manage get api
    app.get('/volunteer-needs', async (req, res) => {
      try {
        const posts = await volunteerCollection.find().toArray();
        res.json(posts);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching posts' });
      }
    })



    //  Delete a specific post
    app.delete('/volunteer-needs/:id', async (req, res) => {
      try {
        const postId = req.params.id;
        const result = await volunteerCollection.deleteOne({ _id: new ObjectId(postId) });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: 'Error deleting post' });
      }
    });



    // Update a put by ID

    app.put('/volunteer/:id', async (req, res) => {
      const { id } = req.params;
      try {
        // Validate if the ID is valid
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Perform the update
        const updatedPost = await volunteerCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: req.body }
        );

        if (updatedPost.matchedCount === 0) {
          return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ message: 'Post updated successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Error updating post', error });
      }
    });


    // Add this route for fetching upcoming volunteer events
    app.get('/upcoming-volunteer-events', async (req, res) => {
      try {
        const upcomingEvents = await volunteerCollection
          .find()
          .sort({ deadline: 1 })
          .limit(6)
          .toArray();
        res.send(upcomingEvents);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch upcoming events' });
      }
    });


    //  get all success stories
    app.get('/volunteer-success-stories', async (req, res) => {
      try {
        const stories = await volunteerCollection.find().toArray();
        res.json(stories);
      } catch (err) {
        res.status(500).json({ message: 'Error fetching success stories.' });
      }
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
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
  res.send('Empowering Volunteers,Transforming Lives')
})

app.listen(port, () => {
  console.log(`Empowering Volunteers,Transforming Lives at: ${port}`)
})