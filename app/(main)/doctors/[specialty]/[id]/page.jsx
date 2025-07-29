import { getDoctorById, getAvailableTimeSlots } from "@/actions/appointments";
import DoctorProfile from "./_components/doctor-profile";
import { redirect } from "next/navigation";

const DoctorProfilePage = async ({ params }) => {
  try {
    // Properly await the params
    const resolvedParams = await params;
    console.log("Resolved params:", resolvedParams);
    
    const { id } = resolvedParams;
    console.log("Extracted id:", id);
    
    // Add validation
    if (!id || typeof id !== 'string') {
      console.error("Invalid or missing ID:", id);
      redirect("/doctors");
      return;
    }
    
    // Single call with better error handling
    const [doctorData, slotsData] = await Promise.all([
      getDoctorById(id),
      getAvailableTimeSlots(id),
    ]);
    
    if (!doctorData?.doctor) {
      console.error("No doctor data received");
      redirect("/doctors");
      return;
    }
    
    return (
      <DoctorProfile
        doctor={doctorData.doctor}
        availableDays={slotsData?.days || []}
      />
    );
  } catch (error) {
    console.error("Error in DoctorProfilePage:", error);
    redirect("/doctors");
  }
};

export default DoctorProfilePage;