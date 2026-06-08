import mongoose from "mongoose";
const userschema = mongoose.Schema({
    email: {type: String, required: true},
    name: {type: String},
    channelname: {type: String},
    description: {type: String},
    image: {type: String},
    joinedon: {type: Date, default: Date.now},
    plan: {type: String, enum: ["free", "bronze", "silver", "gold"], default: "free"},
    planPurchasedAt: {type: Date},
    razorpayPaymentId: {type: String},
    phone: {type: String},
    city: {type: String},
    state: {type: String},
})

export default mongoose.model("users", userschema);