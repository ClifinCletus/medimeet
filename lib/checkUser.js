import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

//to check if the current logged in user is present in the db

export const checkUser = async () => {
  const user = await currentUser(); //to get the user details from clerk

  if (!user) {
    return null;
  }

  try {
    //getting the user details from db(here doing call to db)
    //this is a query same as in sql
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: "CREDIT_PURCHASE",
            // Only get transactions from current month
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) { //if user present, get it
      return loggedInUser;
    }

    //else if the user is not present in db, create it in db
    const name = `${user.firstName} ${user.lastName}`;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        transactions: {
          create: {
            type: "CREDIT_PURCHASE",
            packageId: "free_user",
            amount: 0,
          },
        },
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
};