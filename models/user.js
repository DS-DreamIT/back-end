const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  diary: {
    type: [new Schema({ diaryId: String })],
  },
  badge: {
    type: Array,
  },
});

const User = mongoose.model("User", userSchema, "user");

module.exports = { User };
