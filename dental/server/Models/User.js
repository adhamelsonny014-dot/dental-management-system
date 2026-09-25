const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { PASSWORD_MIN, PASSWORD_MESSAGE, isStrongPassword } = require("../utils/password");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: PASSWORD_MIN,
      validate: {
        // Only enforce complexity on a freshly set plaintext password; a stored
        // bcrypt hash (unmodified on later saves) is left untouched.
        validator: function (v) {
          if (typeof this.isModified === "function" && !this.isModified("password")) return true;
          return isStrongPassword(v);
        },
        message: PASSWORD_MESSAGE,
      },
    },
    role: {
      type: String,
      enum: ["admin", "dentist", "receptionist", "assistant"],
      default: "receptionist",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
