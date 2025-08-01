"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

//here contains the server actions for setting and getting my availablty slots
// Server action to set availability slots for specific dates
export async function setAvailabilitySlots(formData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Find the currently logged in doctor
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });
    
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get the information from formData
    const date = formData.get("date");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!date || !startTime || !endTime) {
      throw new Error("Date, start time and end time are required!");
    }

    // Validate that start time is before end time
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    
    if (startDateTime >= endDateTime) {
      throw new Error("Start time must be before end time");
    }

    // Check if there's already an availability slot for this date
    const existingSlotForDate = await db.availability.findFirst({
      where: {
        doctorId: doctor.id,
        startTime: {
          gte: new Date(date + "T00:00:00.000Z"),
          lt: new Date(date + "T23:59:59.999Z"),
        },
      },
    });

    if (existingSlotForDate) {
      throw new Error("Availability already exists for this date. Delete the existing slot first.");
    }

    // Create new availability slot for the specific date
    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "AVAILABLE",
      },
    });

    // Revalidate the doctor page to show updated availability
    revalidatePath("/doctor");
    
    return { success: true, slot: newSlot };
  } catch (error) {
    throw new Error("Failed to set availability: " + error.message);
  }
}

// Server action to delete an availability slot
export async function deleteAvailabilitySlot(formData) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Find the currently logged in doctor
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });
    
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Get the slot ID from formData
    const slotId = formData.get("slotId");
    
    if (!slotId) {
      throw new Error("Slot ID is required!");
    }

    // Find the slot and verify it belongs to this doctor
    const slot = await db.availability.findFirst({
      where: {
        id: slotId,
        doctorId: doctor.id,
      },
      include: {
        appointment: true, // Include appointment to check if slot is booked
      },
    });

    if (!slot) {
      throw new Error("Availability slot not found or unauthorized");
    }

    // Don't allow deletion if there's a booked appointment
    if (slot.appointment) {
      throw new Error("Cannot delete availability slot with existing appointment");
    }

    // Delete the availability slot
    await db.availability.delete({
      where: {
        id: slotId,
      },
    });

    // Revalidate the doctor page to show updated availability
    revalidatePath("/doctor");
    
    return { success: true, message: "Availability slot deleted successfully" };
  } catch (error) {
    throw new Error("Failed to delete availability slot: " + error.message);
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

//(for doctors) for getting the appointments to show in the appointments area
export async function getDoctorAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ["SCHEDULED"],
        },
      },
      include: {
        //also give the patient information, not receivedit by default
        patient: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    throw new Error("failed to fetch appointments: " + error.message);
  }
}

//for cancelling the appointment: both by doctor and the patient
export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    //checking if its the patient or the doctor

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("user not found!");
    }

    const appointmentId = formData.get("appointmentId");
    if (!appointmentId) {
      throw new Error("Appointment ID is required!");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        //fetches and gived the patient and doctor details based on their userId
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    //checking if the user who is trying to cancel the appointment is not the user who is currently logged in
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    //transaction
    /**
     * done here:
     * - provides the deducted credit back to the user
     * - reduceds the credits added to the doctor
     */

    await db.$transaction(async (tx) => {
      //change the appointments status to cancelled
      await tx.appointment.update({
        wher: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      //make the creedit history added
      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      //update patient's credit balance(increment)
      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      //update doctor's credit balance(decrement)
      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });
    });

    if (user.role === "PATIENT") {
      revalidatePath("/appointments");
    } else if (user.role === "DOCTOR") {
      revalidatePath("/doctor");
    }

    return { success: true };
  } catch (error) {
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

//Adding the appoinment notes by the doctor
export async function addAppointmentNotes(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes");

    //checking if the appointment belongs to this user(doctor)
    const appoinment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appoinment) {
      throw new Error("appoinment not found");
    }

    //updating the appointment with the notes
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath("/doctor");
    return { success: true, appoinment: updatedAppointment };
  } catch (error) {
    throw new Error("failed to update notes: " + error.message);
  }
}

//to mark the appointment as completed (by doctor)
export async function markAppointmentCompleted(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "DOCTOR",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const appointmentId = formData.get("appointmentId");

    //checking if the appointment belongs to this user(doctor)
    const appoinment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: true,
      },
    });

    if (!appoinment) {
      throw new Error("appoinment not found");
    }

    //checking if the appointment is currently scheduled
    if (appoinment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be marked as complete");
    }

    //checking if the slot end time have reached: not able to complete the appointment before it
    const now = new Date();
    const appoinmentEndTime = new Date(appoinment.endTime);

    if (now < appoinmentEndTime) {
      throw new Error(
        "cannot mark appointment as completed before the scheduled end time"
      );
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "COMPLETED",
      },
    });

    revalidatePath("/doctor");
    return {
      success: true,
      appoinment: updatedAppointment,
    };
  } catch (error) {
    throw new Error(
      "failed to mark appointment as completed: " + error.message
    );
  }
}
