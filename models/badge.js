const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObejctId = Schema.Types.ObjectId;

const badgeSchema = new Schema({
  id: {
    type: ObejctId,
  },
  name: {
    type: String,
  },
  img: {
    type: Array,
  },
  explanation: {
    type: Date,
  },
  requried: {
    type: Array,
  },
});

const Badge = mongoose.model("Badge", badgeSchema, "badges");

module.exports = { Badge };
