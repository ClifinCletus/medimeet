"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getPatientAppointments() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
      select: {
        id: true, //need the patient's id
      },
    });

    if (!user) {
      throw new Error("Patient not found!");
    }

    const appoinments = await db.appointment.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        //getting the doctor related details in the appointment
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appoinments };
  } catch (error) {
    return {
      error: "failed to fetch appointments" + error.message,
    };
  }
}
