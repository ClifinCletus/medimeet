"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//here contains the server actions for setting and getting my availablty slots

export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    //finding the currently logged in doctor
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    //get the information from formData
    //the startTime and endTime set by the doctors for their availablty
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required!");
    }

    if (startTime >= endTime) {
      throw new Error("start time must be before end time");
    }

    //if doctor have any existing slots, delete it and add the new slots
    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
    });

    if (existingSlots.length > 0) {
      //finding slots with no appointment and deleting it
      const slotsWithAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }

    //creating new availability slot
    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "AVAILABLE",
      },
    });

    revalidatePath("/doctor");
    return { success: true, slot: newSlot };
  } catch (error) {
    throw new Error("failed to set availability: " + error.message);
  }
}

export async function getAvailabilitySlots() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    //finding the currently logged in doctor
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const availabilitySlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("failed to fetch availability: " + error.message);
  }
}

export async function getDoctorAppointments() {
  return [];
}
