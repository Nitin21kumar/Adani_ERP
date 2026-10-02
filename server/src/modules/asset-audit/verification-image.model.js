import mongoose from "mongoose";

const schema = new mongoose.Schema({
  verification: { type: mongoose.Schema.Types.ObjectId, ref: "AssetVerification", required: true },
  imageUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  // Captured from the device at the moment a photo is taken with the camera
  // button (best-effort — omitted if location permission was denied or the
  // photo was picked from the gallery instead).
  location: {
    latitude: Number,
    longitude: Number
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model("VerificationImage", schema);
