"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop, Enquiry } from "@/lib/models";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";

const enquirySchema = z.object({
  farmerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  cropId: z.string().optional(),
  message: z.string().trim().min(10).max(1000),
});

export type EnquiryFormState = { error?: string; success?: string } | undefined;

export async function submitEnquiryAction(
  _previousState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const locale = await getLocale();
  const parsed = enquirySchema.safeParse({
    farmerName: formData.get("farmerName"),
    phone: formData.get("phone"),
    cropId: formData.get("cropId"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: text(locale, "कृपया नाव, योग्य 10 अंकी मोबाईल क्रमांक आणि किमान 10 अक्षरांचा संदेश भरा.", "Enter your name, a valid 10-digit mobile number, and a message of at least 10 characters.") };
  }

  try {
    await connectToDatabase();
    let crop: string | null = null;
    if (parsed.data.cropId) {
      if (!/^[a-f\d]{24}$/i.test(parsed.data.cropId)) {
        return { error: text(locale, "निवडलेले पीक चुकीचे आहे. कृपया पुन्हा निवडा.", "The selected crop is invalid. Please choose again.") };
      }
      const activeCrop = await Crop.findOne({ _id: parsed.data.cropId, isActive: true }).select("_id").lean();
      if (!activeCrop) return { error: text(locale, "निवडलेले पीक उपलब्ध नाही. कृपया पुन्हा निवडा.", "The selected crop is unavailable. Please choose again.") };
      crop = parsed.data.cropId;
    }

    await Enquiry.create({
      farmerName: parsed.data.farmerName,
      phone: parsed.data.phone,
      crop,
      message: parsed.data.message,
    });
  } catch (error) {
    console.error("Could not save farmer enquiry:", error);
    return { error: text(locale, "चौकशी जतन करता आली नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.", "Your enquiry could not be saved. Please try again shortly.") };
  }

  return { success: text(locale, "तुमची चौकशी पाठवली आहे. आम्ही लवकरच संपर्क करू.", "Your enquiry has been sent. We’ll contact you soon.") };
}
