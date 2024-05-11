const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment");
    const collection = db.collection("users");
    const skillCollection = db.collection("skills");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // Skill Post Operation
    app.post("/api/v1/create-skill", async (req, res) => {
      const { image, title } = req.body;
      //   console.log(req.body);
      try {
        // Insert Skill into the cloth collection
        const result = await skillCollection.insertOne({
          image,
          title,
        });
        console.log(result);

        res.status(201).json({
          success: true,
          message: "Skill added successfully",
        });
      } catch (error) {
        console.error("Error adding Skill:", error);
        res.status(500).json({
          success: false,
          message: "Error adding Skill",
        });
      }
    });

    // Get all Skill

    app.get("/api/v1/skills", async (req, res) => {
      try {
        const skills = await skillCollection.find({}).toArray();
        res.json({
          success: true,
          data: skills,
        });
      } catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching skills",
        });
      }
    });

    // Skill Delete Operation
    app.delete("/api/v1/skills/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await skillCollection.deleteOne(query, { new: true });
      res.send(result);
    });

    // Get a single cloth item by ID
    app.get("/api/v1/skills/:id", async (req, res) => {
      const skillId = req.params.id;

      try {
        const skill = await skillCollection.findOne({
          _id: new ObjectId(skillId),
        });

        if (skill) {
          res.json({
            success: true,
            data: skill,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "skill not found",
          });
        }
      } catch (error) {
        console.error("Error fetching skill:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching skill",
        });
      }
    });

    // Cloth Update Operation
    app.put("/api/v1/skills/:id", async (req, res) => {
      const skillId = req.params.id;
      const { title, image } = req.body;

      try {
        const filter = { _id: new ObjectId(skillId) };
        const updateDoc = {
          title,
          image,
        };

        const result = await skillCollection.replaceOne(filter, updateDoc, {
          new: true,
        });

        if (result.modifiedCount === 1) {
          res.json({
            success: true,
            message: "Skill updated successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Skill not found",
          });
        }
      } catch (error) {
        console.error("Error updating Skill:", error);
        res.status(500).json({
          success: false,
          message: "Error updating Skill",
        });
      }
    });
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Portfolio Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Portfolio server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
