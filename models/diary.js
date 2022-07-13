const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObejctId },
} = Schema;

const imageSchema = new Schema({
  width: Number,
  height: Number,
});

const diarySchema = new Schema({
  author: {
    type: ObejctId,
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
  analysis: {
    type: String,
  },
  emotion: {
    type: Array,
  },
  resultImg: {
    type: imageSchema,
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

const Diary = mongoose.model("Diary", diarySchema, "diary");

module.exports = { Diary };
