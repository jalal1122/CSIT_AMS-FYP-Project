import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI not found in environment variables.");
}

async function resetDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));

    // Drop database
    console.log("Dropping database...");
    const dropResult = await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully:", dropResult);

    // Re-seed Super Admin
    console.log("Re-seeding initial super admin...");
    const admin = new User({
      name: "Super Admin",
      email: "admin@csit-ams.edu",
      username: "admin",
      password: "AdminPassword123!",
      role: "admin",
      accountStatus: "Active",
      mustChangePassword: false
    });

    await admin.save();
    console.log("Super admin created successfully!");
    console.log("Credentials: username = admin, password = AdminPassword123!");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Reset complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase();
