"use strict";
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
Object.defineProperty(exports, "__esModule", { value: true });
// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true, trim: true },
//   password: { type: String, required: true, minlength: 6 },
//   role: { type: String, enum: ["admin", "faculty", "student"], default: "student" },
// }, { timestamps: true });
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });
// userSchema.methods.comparePassword = function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };
// module.exports = mongoose.model("User", userSchema);
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "faculty", "student"], default: "student" },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("User", userSchema);
