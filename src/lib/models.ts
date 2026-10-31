import mongoose, { Schema } from "mongoose";

const cropSchema = new Schema({
  nameMr: { type: String, required: true, trim: true },
  nameEn: { type: String, required: true, trim: true },
  unit: { type: String, default: "क्विंटल" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const dailyRateSchema = new Schema({
  crop: { type: Schema.Types.ObjectId, ref: "Crop", required: true, index: true },
  date: { type: String, required: true, index: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  expiresAt: { type: Date, index: { expires: 0 } },
}, { timestamps: true });
dailyRateSchema.index({ crop: 1, date: 1 }, { unique: true });

const enquirySchema = new Schema({
  farmerName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  crop: { type: Schema.Types.ObjectId, ref: "Crop", default: null },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
}, { timestamps: true });
enquirySchema.index({ createdAt: -1 });

export const Crop = mongoose.models.Crop || mongoose.model("Crop", cropSchema);
export const DailyRate = mongoose.models.DailyRate || mongoose.model("DailyRate", dailyRateSchema);
export const Enquiry = mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);
