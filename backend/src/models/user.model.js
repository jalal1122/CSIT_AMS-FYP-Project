import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
      index: true,
      // Reg No for students (e.g., "CSIT-2022-001"), Employee ID for teachers
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: [true, "Role is required"],
      default: "student",
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
      // Set to false after /setup-profile is completed
    },
    info: {
      type: new mongoose.Schema({
        rollNo: { type: String, trim: true },
        section: { type: String, trim: true },
        semester: { type: Number, min: 1, max: 8 },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
        departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
        disciplineId: { type: mongoose.Schema.Types.ObjectId, ref: "Discipline" },
        // Teacher fields
        designation: { type: String, trim: true },
        phone: { type: String, trim: true },
      }, { _id: false }),
      default: {},
    },
    avatar: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
    },
    // 2FA fields
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    // Persisted device binding for anti-buddy punching
    deviceId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      accountStatus: this.accountStatus,
      mustChangePassword: this.mustChangePassword,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );
};

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
