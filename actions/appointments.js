import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { addDays, addMinutes, endOfDay, format, isBefore } from "date-fns";
import { deductCreditsForAppointment } from "./credits";
import { revalidatePath } from "next/cache";
import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";

//the credentials and session needed things for the vonage
const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});
//vonage instance
const vonage = new Vonage(credentials, {});

//for the appointment booking and related things

export async function getDoctorById(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId.id,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return { doctor };
  } catch (error) {
    throw new Error("failed to fetch the doctor details", error.message);
  }
}

export async function getAvailableTimeSlots(doctorId) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId.id,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    //to get the latest availability
    const availability = await db.availability.findFirst({
      where: {
        doctorId: doctor.id,
        status: "AVAILABLE",
      },
    });

    if (!availability) {
      throw new Error("No availability set by doctor");
    }

    //getting the availability for next 4 days:

    const now = new Date();
    //the next 4 days including today
    const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

    //getting existing appointments of the doctor(till the 4th day) so to remove them to be able to allocate by others
    const lastDay = endOfDay(days[3]); //means the end time of the day here(from the array, getting the last day's end time)
    const existingAppointments = await db.appointment.findMany({
      where: {
        //getting appointments till the 4th day end
        doctorId: doctor.id,
        status: "SCHEDULED",
        startTime: {
          lte: lastDay,
        },
      },
    });

    //now filtering and getting only availabe till slots

    const availableSlotsByDay = {};

    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];

      //create a copy of the availability start/end times for this day
      const availabilityStart = new Date(availability.startTime);
      const availabilityEnd = new Date(availability.endTime);

      //set the day to the current day we are processing
      availabilityStart.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      availabilityEnd.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      //taking the current time and end time in the daya and hence creating the available slots
      let current = new Date(availabilityStart);
      const end = new Date(availabilityEnd);

      /*isBefore(addMinutes(current,30),end) means:
      here each aapointment is of 30 minutes.so, the current time (start time of the availability) + 30 minutes is before the end time (to check if the current time with 30 minutes not gets to the end of the appointment time availabe by doctor)
      second or means the last slot*/
      while (
        isBefore(addMinutes(current, 30), end) ||
        +addMinutes(current, 30) === +end
      ) {
        const nextSlot = addMinutes(current, 30);

        if (isBefore(current, now)) {
          //if current slot have been passed
          current = nextSlot;
          continue;
        }

        //calculating the overlapping slots next to our appointment
        const overlaps = existingAppointments.some((appointment) => {
          const aStart = new Date(appointment.startTime);
          const aEnd = new Date(appointment.endTime);

          return (
            //overlapping conditions, hence not consider the currentSlot as it overlaps here
            (current >= aStart && current < aEnd) ||
            (nextSlot > aStart && nextSlot <= aEnd) ||
            (current <= aStart && nextSlot >= aEnd)
          );
        });

        if (!overlaps) {
          availableSlotsByDay[dayString].push({
            startTime: current.toISOString(),
            endTime: nextSlot.toISOString(),
            formatted: `${format(current, "h:mm a")} - ${format(
              //the formatted slots
              next,
              "h:mm a"
            )}`,
            day: format(current, "EEEE, MMMM d"), //the day
          });
        }

        current = nextSlot;
      }
    }

    //convert to array of slots grouped by day for easier consumption by UI
    const result = Object.entries(availableSlotsByDay).map(([date, slots]) => ({
      date,
      displayDate:
        slots.length > 0
          ? slots[0].day
          : format(new Date(date), "EEEE, MMMM d"),
      slots,
    }));

    return { days: result };
  } catch (error) {
    throw new Error("failed to fetch doctor details" + error.message);
  }
}

export async function bookAppointments(formData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    //get the patient user
    const patient = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "PATIENT",
      },
    });

    if (!patient) {
      throw new Error("patient not found");
    }

    //parse the form Data
    const doctorId = formData.get("doctorId");
    const startTime = formData.get("startTime");
    const endTime = new Date(formData.get("endTime"));
    const patientDescription = formData.get("description") || null;

    if (!doctorId || !startTime || !endTime) {
      throw new Error("Doctor, start time, and end time are required!!");
    }

    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    //checking if patient have credits to book the appointment
    if (patient.credits < 2) {
      throw new Error("Insufficient credits to book an appointment");
    }

    //check if requested time slot is availabe (to confirm it, we are already checking it to get the slots, but still doing it)
    const overLappingAppointment = await db.appointment.findUnique({
      where: {
        doctorId: doctorId,
        status: "SCHEDULED",
        OR: [
          //checking if any of these overlapping conditions are true
          {
            //New appointment starts during an exisiting appointment
            startTime: {
              lte: startTime,
            },
            endTime: {
              gt: startTime,
            },
          },
          {
            //Nee appointment ends during an existing appointment
            startTime: {
              lt: endTime,
            },
            endTime: {
              gte: endTime,
            },
          },
          {
            //New appointment completely overlaps an exisiting appointment
            startTime: {
              gte: startTime,
            },
            endTime: {
              lte: endTime,
            },
          },
        ],
      },
    });

    if (overLappingAppointment) {
      throw new Error("This time slot is already booked");
    }

    //creating a new vonage session using vonage API
    const sessionId = await createVideoSession();

    /*what all are we doing in this:
    - when an appointment is booked, the credits are deducted from the patient and added to the doctor's account.
    - add the full information to db
    */

    const { success, error } = await deductCreditsForAppointment(
      patient.id,
      doctor.id
    );

    if (!success) {
      throw new Error(error || "failed to deduct credits");
    }

    //create the appointment with the video session ID
    const appointment = await tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startTime,
        endTime,
        patientDescription,
        status: "SCHEDULED",
        videoSessionId: sessionId, //store the vonage session ID
      },
    });

    revalidatePath("/appointments");
    return { success: true, appointment: appointment };
  } catch (error) {
    throw new Error("Failed to book Appointment:" + error.message);
  }
}

//to create the vonage sessionId
async function createVideoSession() {
  try {
    const session = await vonage.video.createSession({
      mediaMode: "routed", //means, all the traffic goes through vonage's server
    });

    return session.sessionId;
  } catch (error) {
    throw new Error("failed to create video session: " + error.message);
  }
}
