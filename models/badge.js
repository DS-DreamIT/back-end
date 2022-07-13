const mongoose = require("mongoose");
const { Schema } = mongoose;

const {
  Types: { ObejctId },
} = Schema;

const imageSchema = new Schema({
  width: Number,
  height: Number,
});

const badgeSchema = new Schema({
  id: {
    type: ObejctId,
  },
  name: {
    type: String,
  },
  img: {
    type: imageSchema,
  },
  explanation: {
    type: Date,
  },
  requried: {
    type: Array,
  },
});

const Badge = mongoose.model("Badge", badgeSchema, "badge");

module.exports = { Badge };
