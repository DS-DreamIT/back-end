const mongoose = require("mongoose");
const { User } = require("./user");
const { Diary } = require("./diary");
const { Schema } = mongoose;

const likeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: User,
  },
  diaryId: {
    type: Schema.Types.ObjectId,
    ref: Diary,
  },
});

const Like = mongoose.model("Like", likeSchema, "likes");

module.exports = { Like };
