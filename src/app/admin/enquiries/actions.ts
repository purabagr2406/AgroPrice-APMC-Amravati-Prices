"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Enquiry } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/session";

const updateSchema = z.object({
  enquiryId: z.string().regex(/^[a-f\d]{24}$/i),
  status: z.enum(["contacted", "closed"]),
});

export async function updateEnquiryStatusAction(formData: FormData) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const parsed = updateSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid enquiry status update.");

  await connectToDatabase();
  const result = await Enquiry.updateOne(
    { _id: parsed.data.enquiryId },
    { $set: { status: parsed.data.status } },
  );
  if (result.matchedCount !== 1) throw new Error("Enquiry no longer exists.");
  revalidatePath("/admin/enquiries");
}
