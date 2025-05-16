import mongoose from "mongoose";

const schema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Plese enter the Coupon Code"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Plese enter the Discount Amount"],
  },
});

export const Coupon = mongoose.model("Coupon", schema);
