import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
  title: "onboarding - Medimeet",
  description: "Complete your profile to get started with Medimeet",
};

const onboardingLayout = async ({ children }) => {
  const user = await getCurrentUser();

  //doing the verification and redirection logic here
  if (user) {
    if (user.role === "PATIENT") {
      redirect("/doctors");
    } else if (user.role === "DOCTOR") {
      if (user.verificationStatus === "VERIFIED") {
        redirect("/doctor");
      } else {
        redirect("/doctor/verification");
      }
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }
  return (
    <div className="container mt-12 mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl mb-2 gradient-title">
            Welcome to Medimeet
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell Us how you want to use the platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default onboardingLayout;
