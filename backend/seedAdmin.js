import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

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
    console.log("Super admin created! Username: admin, Password: AdminPassword123!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

seedAdmin();
