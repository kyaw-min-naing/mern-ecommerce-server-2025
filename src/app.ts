import express from "express";
import { connectDB, connectRedis } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import dotenv from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/orders.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";

dotenv.config();

const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "";
const clientURL = process.env.CLIENT_URL || "";
const redisURI = process.env.REDIS_URI || "";
export const redisTTL = process.env.REDIS_TTL || 60 * 60 * 4;

connectDB(mongoURI);
export const redis = connectRedis(redisURI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

const app = express();

app.use(
  cors({
    origin: clientURL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("API is Working with /api/v1");
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
