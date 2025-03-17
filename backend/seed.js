require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");

async function seedDatabase() {
  try {
    // Connect to MongoDB with database name explicitly set
    await mongoose.connect(process.env.MONGO_URI, { 
      dbName: "web7", // Ensure it matches your database name
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Connected to MongoDB Atlas");

    // Delete existing data to prevent duplicates
    await User.deleteMany({});
    await Message.deleteMany({});
    console.log("🗑️ Existing data cleared");

    // Insert sample users
    const users = await User.insertMany([
      { username: "john_doe", password: "hashedpassword123" },
      { username: "alice_smith", password: "hashedpassword456" },
      { username: "bob_jones", password: "hashedpassword789" }
    ]);
    console.log("✅ Users inserted:", users);

    // Insert sample messages
    const messages = await Message.insertMany([
      { sender: "john_doe", recipient: "alice_smith", message: "Hey Alice, how are you?", timestamp: new Date() },
      { sender: "alice_smith", recipient: "john_doe", message: "Hi John! I'm doing great, thanks!", timestamp: new Date() },
      { sender: "bob_jones", recipient: "john_doe", message: "Hey John, when is our next meeting?", timestamp: new Date() }
    ]);
    console.log("✅ Messages inserted:", messages);

    console.log("🎉 Sample data inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting data:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Run the seed function
seedDatabase();
