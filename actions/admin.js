"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { success } from "zod";

//to check if the user is admin
export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user?.role === "ADMIN"; //checking the user is admin
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

//to getting the applications from the doctors(pending to verify)
export async function getPendingDoctors() {
  const isAdmin = await verifyAdmin(); //checking if admin
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { doctors: pendingDoctors };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

//to get the list of verified doctors
export async function getVerifiedDoctors() {
  const isAdmin = await verifyAdmin(); //checking if admin
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const verifiedDoctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return { doctors: verifiedDoctors };
  } catch (error) {
    throw new Error("Failed to fetch pending doctors");
  }
}

//fn to update the status of the doctor's who are currently pending  using the data received(formData)
export async function updateDoctorStatus(formData) {
  const isAdmin = await verifyAdmin(); //checking if admin
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const status = formData.get("status"); //to which status it need to be made

  //verifying if any of these is missing or any other unqwanted data is received
  if (!doctorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid Input");
  }

  try {
    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to update doctor status: ", error);
    throw new Error(`Failed to update the doctor status: ${error.message}`);
  }
}

//to suspend the doctor: changing back to PENDING state
export async function updateDoctorActiveStatus(formData) {
  const isAdmin = await verifyAdmin(); //checking if admin
  if (!isAdmin) throw new Error("Unauthorized");

  const doctorId = formData.get("doctorId");
  const suspend = formData.get("suspend") === "true";

  if (!doctorId) {
    throw new Error("Doctor ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update doctor status:${error.message}`);
  }
}
