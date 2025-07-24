"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, User } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { setUserRole } from "@/actions/onboarding";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialities";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// *********** VVVV IMP ***********////////
/*here we would use react-hook form for form and data management , zod for schema management(same as joi) and @hookform/resolvers 
for connecting zod with reacthook form */

// we have form for doctors in this page(for their verification and documents submission etc) and users just do onboard

const doctorFormSchema = z.object({
  specialty: z.string().min(1, "specialty is required"),
  experience: z
    .number()
    .min(1, "Experience must be alteast 1 year")
    .max(50, "Experience must be less than 50 years"),
  credentialUrl: z
    .string()
    .url("Please enter a valid URL") //should be a url
    .min(1, "credential Url is required"),
  description: z
    .string()
    .min(20, "Description must be alteast 20 characters")
    .max(1000, "Description cannit exceed 1000 characters"),
});

const OnboardingPage = () => {
  const [step, setStep] = useState("choose-role");
  const router = useRouter();

  //here, we are just calling the setUserRole using the custom hook we created.
  const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

  const {
    register, //to connect the form with the input field
    handleSubmit, //to trigger the submission
    formState: { errors }, //contains form related info like loading etc, we taken errors only  (gets the fieldwise errors)
    setValue, //to set a custom value to a field
    watch, //to monitor a field and do particular actions based on the field value etc..
  } = useForm({
    //connection to zod schema and default values
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  const specialityValue = watch("specialty"); //monitoring the value of this to do certain operations as per its value change

  const handlePatientSelection = async () => {
    if (loading) return;

    const formData = new FormData(); //accessing the formdata from the form
    formData.append("role", "PATIENT");

    await submitUserRole(formData); //calling the useFetch hook api to do api call
  };

  //if data changes, push to that page in the redirect in the data received
  useEffect(() => {
    if (data && data.success) {
      toast.success("role selected");
      router.push(data.redirect);
    }
  }, [data]);

  //to handle the form submission of the doctors
  const onDoctorSubmit = async (data) => {
    if (loading) return;
    console.log("Form data:", data); //for checking purpose

    //here we are setting the values to the form data and then calling the server action and passing the form values

    const formData = new FormData();
    formData.append("role", "DOCTOR");
    formData.append("specialty", data.specialty);
    formData.append("experience", data.experience.toString());
    formData.append("credentialUrl", data.credentialUrl);
    formData.append("description", data.description);

    await submitUserRole(formData);
  };

  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* patient card */}
        <Card
          onClick={() => !loading && handlePatientSelection()}
          className="border-emerald-900/20 hover:border-emarald-700/40 
        cursor-pointer transition-all"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book Appointments, consult with doctors, and manage your
              healthcare journey
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing ....
                </>
              ) : (
                "Continue as a patient"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* doctor card */}
        <Card
          onClick={() => !loading && setStep("doctor-form")}
          className="border-emerald-900/20 hover:border-emarald-700/40 
        cursor-pointer transition-all"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              create your professional profile,set your availablity and provide
              consultations
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              Continue as a Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //doing the doctor form
  if (step === "doctor-form") {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription>
              Please Provide your professional details for verification
            </CardDescription>
          </div>

          {/* the form to get the details of the doctor to enroll and verify them via admin */}
          <form className="space-y-6" onSubmit={handleSubmit(onDoctorSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Speciality</Label>
              {/* this is how to set value via reacthook form (here using the select hence need to set values manually) */}
              <Select
                value={specialityValue}
                onValueChange={(value) => setValue("specialty", value)}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Select Your Speciality" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => {
                    return (
                      <SelectItem key={spec.name} value={spec.name}>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">{spec.icon}</span>
                          {spec.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* for displaying the errors from the speciality */}
              {errors.specialty && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="eg: 5"
                //here, we are doing to add the value to the formData, in the select we needed to manually add the value using setValue, but here the value would be got properly.
                {...register("experience", { valueAsNumber: true })}
              />
              {errors.experience && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">
                Link to Credential Documents
              </Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/my-medical-degree.pdf"
                {...register("credentialUrl")}
              />
              {errors.credentialUrl && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.credentialUrl.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please provide a link to your medical degree or certification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Description of your service</Label>
              <Textarea
                id="description"
                placeholder="Describe your expertise, services and approach tp patient care..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")} //to go back to initial place
                className="border-emerald-900/30"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-400"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submitting for verification"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
};

export default OnboardingPage;
