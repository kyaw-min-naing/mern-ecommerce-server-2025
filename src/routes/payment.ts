import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  getCoupon,
  newCoupon,
  updateCoupon,
} from "../controllers/payment.js";

const app = express.Router();

app.post("/create", createPaymentIntent);

app.get("/discount", applyDiscount);

//route - /api/v1/payment/coupon/new
app.post("/coupon/new", adminOnly, newCoupon);

app.get("/coupon/all", adminOnly, allCoupons);

app
  .route("/coupon/:id")
  .get(adminOnly, getCoupon)
  .put(adminOnly, updateCoupon)
  .delete(adminOnly, deleteCoupon);

export default app;
