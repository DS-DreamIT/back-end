const mongoose = require("mongoose");
const { Schema } = mongoose;

const diarySchema = new Schema({
  author: {
    type: String,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  keyword: {
    type: Array,
  },
  analysisType: {
    type: Number,
  },
  emotion: {
    type: Array,
  },
  img: {
    type: Array,
  },
  music: {
    type: String,
  },
  likes: {
    type: Number,
    required: true,
    default: 0,
  },
  release: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const Diary = mongoose.model("Diary", diarySchema, "diaries");

module.exports = { Diary };
