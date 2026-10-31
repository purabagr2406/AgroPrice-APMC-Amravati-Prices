"use server";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop, DailyRate, Enquiry } from "@/lib/models";
import { clearAdminSession, createAdminSession, getAdminSession } from "@/lib/session";
import { isRateDateInWindow, pruneExpiredRates, rateExpiryDate } from "@/lib/rate-history";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const priceSchema = z.object({
  cropId: z.string().regex(/^[a-f\d]{24}$/i),
  minPrice: z.number().finite().nonnegative(),
  maxPrice: z.number().finite().nonnegative(),
}).refine((rate) => rate.minPrice <= rate.maxPrice);

const cropSchema = z.object({
  cropId: z.string().optional(),
  nameMr: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().min(1).max(60),
});

const cropIdSchema = z.object({ cropId: z.string().regex(/^[a-f\d]{24}$/i) });
const visibilitySchema = cropIdSchema.extend({ isActive: z.enum(["true", "false"]) });

type CropActionResult = { error?: string; success?: string } | undefined;

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/login?error=invalid");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !passwordHash) throw new Error("Admin login environment variables are not configured.");

  const emailMatches = parsed.data.email.trim().toLowerCase() === adminEmail;
  const passwordMatches = await bcrypt.compare(parsed.data.password, passwordHash);
  if (!emailMatches || !passwordMatches) redirect("/admin/login?error=credentials");
  await createAdminSession(adminEmail);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

type ActionResult = { error: string } | undefined;

export async function saveRatesAction(formData: FormData): Promise<ActionResult> {
  if (!(await getAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const date = formData.get("rateDate");
  if (typeof date !== "string" || !isRateDateInWindow(date)) {
    return { error: text(locale, "गेल्या 90 दिवसांतील तारीख निवडा.", "Choose a date within the last 90 days.") };
  }

  const grouped = new Map<string, Partial<Record<"min" | "max", string>>>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("rate_")) continue;
    const [, cropId, field] = key.split("_");
    if (!cropId || !["min", "max"].includes(field) || typeof value !== "string") {
      return { error: text(locale, "फॉर्ममधील पीक किंवा किंमत चुकीची आहे.", "A crop or price field is invalid.") };
    }
    const fields = grouped.get(cropId) ?? {};
    fields[field as "min" | "max"] = value.trim();
    grouped.set(cropId, fields);
  }

  const submittedRows = [...grouped.entries()].filter(([, values]) =>
    [values.min, values.max].some((value) => value !== undefined && value !== ""),
  );
  if (submittedRows.length === 0) return { error: text(locale, "किमान एका पिकासाठी दर भरा.", "Enter rates for at least one crop.") };

  const rates = [];
  for (const [cropId, values] of submittedRows) {
    const parsed = priceSchema.safeParse({
      cropId,
      minPrice: values.min === undefined || values.min === "" ? Number.NaN : Number(values.min),
      maxPrice: values.max === undefined || values.max === "" ? Number.NaN : Number(values.max),
    });
    if (!parsed.success) {
      return { error: text(locale, "प्रत्येक भरलेल्या पिकासाठी किमान आणि कमाल दर द्या. कमाल दर किमान दरापेक्षा कमी नसावा.", "Enter both minimum and maximum rates for each crop. The maximum must not be less than the minimum.") };
    }
    rates.push(parsed.data);
  }

  try {
    await connectToDatabase();
    await pruneExpiredRates();
    const activeCrops = await Crop.find({ _id: { $in: rates.map((rate) => rate.cropId) }, isActive: true }).select("_id").lean();
    if (activeCrops.length !== rates.length) return { error: text(locale, "एक किंवा अधिक पीक नोंदी सक्रिय नाहीत. पृष्ठ रीलोड करून प्रयत्न करा.", "One or more crops are inactive. Reload the page and try again.") };

    await DailyRate.bulkWrite(rates.map((rate) => ({
      updateOne: {
        filter: { crop: rate.cropId, date },
        update: { $set: { minPrice: rate.minPrice, maxPrice: rate.maxPrice, expiresAt: rateExpiryDate(date) } },
        upsert: true,
      },
    })), { ordered: true });
  } catch (error) {
    console.error("Could not save daily rates:", error);
    return { error: text(locale, "दर जतन करता आले नाहीत. MongoDB कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.", "Rates could not be saved. Check the database connection and try again.") };
  }

  redirect(`/admin?saved=1&date=${encodeURIComponent(date)}`);
}

export async function saveCropAction(_previousState: CropActionResult, formData: FormData): Promise<CropActionResult> {
  if (!(await getAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const parsed = cropSchema.safeParse({
    cropId: formData.get("cropId") || undefined,
    nameMr: formData.get("nameMr"),
    nameEn: formData.get("nameEn"),
  });
  if (!parsed.success || (parsed.data.cropId && !/^[a-f\d]{24}$/i.test(parsed.data.cropId))) {
    return { error: text(locale, "मराठी आणि इंग्रजी पीकनावे योग्य भरा.", "Enter valid Marathi and English crop names.") };
  }

  try {
    await connectToDatabase();
    const duplicate = await Crop.findOne({
      _id: parsed.data.cropId ? { $ne: parsed.data.cropId } : { $exists: true },
      $or: [
        { nameEn: { $regex: `^${parsed.data.nameEn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { nameMr: parsed.data.nameMr },
      ],
    }).select("_id").lean();
    if (duplicate) return { error: text(locale, "या नावाचे पीक आधीपासून आहे.", "A crop with this name already exists.") };

    if (parsed.data.cropId) {
      const result = await Crop.updateOne(
        { _id: parsed.data.cropId },
        { $set: { nameMr: parsed.data.nameMr, nameEn: parsed.data.nameEn } },
      );
      if (result.matchedCount !== 1) return { error: text(locale, "पीक सापडले नाही. पृष्ठ रीलोड करून प्रयत्न करा.", "Crop not found. Reload the page and try again.") };
    } else {
      await Crop.create({ nameMr: parsed.data.nameMr, nameEn: parsed.data.nameEn, unit: "क्विंटल" });
    }

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/rates");
    revalidatePath("/enquiries");
    return { success: parsed.data.cropId ? text(locale, "पीक माहिती जतन झाली.", "Crop details saved.") : text(locale, "नवीन पीक जोडले.", "Crop added.") };
  } catch (error) {
    console.error("Could not save crop:", error);
    return { error: text(locale, "पीक जतन करता आले नाही. कृपया पुन्हा प्रयत्न करा.", "Crop could not be saved. Please try again.") };
  }
}

export async function setCropVisibilityAction(_previousState: CropActionResult, formData: FormData): Promise<CropActionResult> {
  if (!(await getAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const parsed = visibilitySchema.safeParse({
    cropId: formData.get("cropId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { error: text(locale, "पीक निवड चुकीची आहे. पृष्ठ रीलोड करा.", "Invalid crop selection. Reload the page.") };

  try {
    await connectToDatabase();
    const result = await Crop.updateOne(
      { _id: parsed.data.cropId },
      { $set: { isActive: parsed.data.isActive === "true" } },
    );
    if (result.matchedCount !== 1) return { error: text(locale, "पीक सापडले नाही. पृष्ठ रीलोड करून प्रयत्न करा.", "Crop not found. Reload the page and try again.") };
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/rates");
    revalidatePath("/enquiries");
    return { success: parsed.data.isActive === "true" ? text(locale, "पीक सार्वजनिक यादीत दाखवले जाईल.", "Crop is now visible to customers.") : text(locale, "पीक सार्वजनिक यादीतून लपवले.", "Crop is now hidden from customers.") };
  } catch (error) {
    console.error("Could not change crop visibility:", error);
    return { error: text(locale, "पीक स्थिती बदलता आली नाही. कृपया पुन्हा प्रयत्न करा.", "Crop visibility could not be changed. Please try again.") };
  }
}

export async function deleteCropAction(_previousState: CropActionResult, formData: FormData): Promise<CropActionResult> {
  if (!(await getAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const parsed = cropIdSchema.safeParse({ cropId: formData.get("cropId") });
  if (!parsed.success) return { error: text(locale, "पीक निवड चुकीची आहे. पृष्ठ रीलोड करा.", "Invalid crop selection. Reload the page.") };

  let session: mongoose.ClientSession | undefined;
  try {
    await connectToDatabase();
    const transactionSession = await mongoose.startSession();
    session = transactionSession;
    await transactionSession.withTransaction(async () => {
      const crop = await Crop.findById(parsed.data.cropId).session(transactionSession);
      if (!crop) throw new Error("Crop no longer exists.");
      await DailyRate.deleteMany({ crop: parsed.data.cropId }).session(transactionSession);
      await Enquiry.updateMany({ crop: parsed.data.cropId }, { $set: { crop: null } }).session(transactionSession);
      await Crop.deleteOne({ _id: parsed.data.cropId }).session(transactionSession);
    });
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/rates");
    revalidatePath("/enquiries");
    return { success: text(locale, "पीक आणि त्याचे जुने दर हटवले. चौकशी नोंदी जतन केल्या आहेत.", "Crop and its rate history deleted. Farmer enquiries were kept.") };
  } catch (error) {
    console.error("Could not delete crop:", error);
    return { error: text(locale, "पीक हटवता आले नाही. कृपया पुन्हा प्रयत्न करा.", "Crop could not be deleted. Please try again.") };
  } finally {
    await session?.endSession();
  }
}
