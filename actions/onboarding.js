"use server";

import { db } from "@/lib/prisma";
//for setting the role of the user based on the data from the onboarding page

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  //find user in the db
  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) throw new Error("User not found in database");

  const role = formData.get("role");

  //if the role is not present or not a PATIENT or DOCTOR
  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" }; //IMP
    }

    if (role === "DOCTOR") {
      //would get the details from the formData(we have added these values to the formdata in the onboarding page, hence can access it using "get")
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All Fields are required in doctor form details");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" }; //IMP:sending that the place to where it should rediredt(not doing redirect directly here)
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user Profile: ${error.message}`);
  }
}

//to get some user details

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user;
  } catch (error) {
    console.error("failed to get user information:", error);
    return null;
  }
}
