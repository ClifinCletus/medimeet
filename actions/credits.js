"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

//this is like our api(backend related)

//for the credit allocation management backend code

//define credit allocation per plan
const PLAN_CREDITS = {
  free_user: 0, //basic p;an: 2 credits
  standard: 10, // standard plan: 10 credits per mont
  premium: 24, //premium: 24 credits per month
};

//each Appointment cost 2 credits
const APPOINTMENT_CREDIT_COST = 2;

export async function checkAndAllocateCredits(user) {
  try {
    if (!user) {
      //if not logged in
      return null;
    }

    //only allocate credits for patients
    if (user.role !== "PATIENT") {
      return user;
    }

    //for checking the user's current subscription(from celer)
    const { has } = await auth();

    //checking the current subscription if true or false based on that we created on clerk
    const hasBasic = has({ plan: "free_user" });
    const hasStandard = has({ plan: "standard" });
    const hasPremium = has({ plan: "premium" });

    let currentPlan = null;
    let creditsToAllocate = 0;

    //allocating the credits based on the plan the user selected
    if (hasPremium) {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (hasStandard) {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (hasBasic) {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }

    if (!currentPlan) {
      //if no current plan present for the user
      return user;
    }

    //checking if the credits have been already allocated this month for any of the plan(any plan have been taken already)
    const currentMonth = format(new Date(), "yyyy-MM");
    if (user.transactions.length > 0) {
      const latestTransaction = user.transactions[0];
      const transactionMonth = format(
        new Date(latestTransaction.createdAt),
        "yyyy-MM"
      );
      const transactionPan = latestTransaction.packageId;

      //If we already allocated credits for this Month and the plan here is same, just return
      if (transactionMonth === currentMonth && transactionPan === currentPlan) {
        return user; //not doing anything
      }
    }

    //doing db api calls(uses $transaction for multiple calls in prisma(if any one fails, all fails))
    //similar kind of pipelinf
    const updatedUser = await db.$transaction(async (tx) => {
      //add the purchased user details in the  creditTransaction table
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: currentPlan,
        },
      });

      //update the user's credit balance in user table
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            increment: creditsToAllocate, //increase the users credits
          },
        },
      });

      return updatedUser;
    });

    //refetch the data in these pages
    revalidatePath("/doctors");
    revalidatePath("/appointments");

    return updatedUser;
  } catch (error) {
    console.error(
      "Failed to check the subscription and allocate credits",
      error.message
    );
    return null;
  }
}
