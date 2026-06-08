import express from "express";
import { createOrder, getPlans, verifyPayment } from "../controllers/payment.js";

const routes = express.Router();

routes.get("/plans", getPlans);
routes.post("/create-order", createOrder);
routes.post("/verify", verifyPayment);

export default routes;
