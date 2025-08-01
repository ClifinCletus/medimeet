// Updated AvailabilitySettings Component
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Loader2, AlertCircle, Calendar, Trash2 } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { setAvailabilitySlots, deleteAvailabilitySlot } from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

const AvailabilitySettings = ({ slots }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // Custom hooks for server actions
  const { loading: savingSlots, fn: submitSlots, data: saveData } = useFetch(setAvailabilitySlots);
  const { loading: deletingSlot, fn: deleteSlot, data: deleteData } = useFetch(deleteAvailabilitySlot);

  // Group slots by date for better display
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = format(new Date(slot.startTime), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: "",
      startTime: "09:30", // Default start time
      endTime: "15:30",   // Default end time
    },
  });

  const watchedDate = watch("date");

  // Set minimum date to today - run only once on mount
  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    setValue("date", today);
    setSelectedDate(today);
  }, []); // Empty dependency array to run only once

  // Function to create proper datetime from date and time
  function createDateTimeFromInputs(dateStr, timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Handle slot submission
  const onSubmit = async (data) => {
    if (savingSlots) return;

    const formData = new FormData();

    // Create proper datetime objects
    const startDateTime = createDateTimeFromInputs(data.date, data.startTime);
    const endDateTime = createDateTimeFromInputs(data.date, data.endTime);

    if (startDateTime >= endDateTime) {
      toast.error("End time must be after start time");
      return;
    }

    // Check if slot already exists for this date
    const existingSlotForDate = groupedSlots[data.date];
    if (existingSlotForDate && existingSlotForDate.length > 0) {
      toast.error("Availability already set for this date. Delete existing slot first.");
      return;
    }

    // Add to form data
    formData.append("date", data.date);
    formData.append("startTime", startDateTime.toISOString());
    formData.append("endTime", endDateTime.toISOString());

    await submitSlots(formData);
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slotId) => {
    if (deletingSlot) return;
    
    const formData = new FormData();
    formData.append("slotId", slotId);
    
    await deleteSlot(formData);
  };

  // Handle success responses
  useEffect(() => {
    if (saveData && saveData?.success) {
      setShowForm(false);
      toast.success("Availability slot created successfully");
      // Reset form to next day
      const nextDay = format(addDays(new Date(watchedDate), 1), "yyyy-MM-dd");
      setValue("date", nextDay);
      setValue("startTime", "09:30");
      setValue("endTime", "15:30");
    }
  }, [saveData]); // Only depend on saveData

  useEffect(() => {
    if (deleteData && deleteData?.success) {
      toast.success("Availability slot deleted successfully");
    }
  }, [deleteData]);

  // Format time string for display
  const formatTimeString = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Format date string for display
  const formatDateString = (dateString) => {
    try {
      return format(new Date(dateString), "EEE, MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Card className="border-emerald-900/20">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-emerald-400" />
          Availability Settings
        </CardTitle>
        <CardDescription>
          Set your availability for specific dates. Default hours are 9:30 AM to 3:30 PM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Availability Display */}
        {!showForm ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">
                Current Availability
              </h3>

              {Object.keys(groupedSlots).length === 0 ? (
                <p className="text-muted-foreground">
                  You haven&apos;t set any availability slots yet. Add your
                  availability to start accepting appointments.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSlots)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, dateSlots]) => (
                    <div
                      key={date}
                      className="p-4 rounded-md bg-muted/20 border border-emerald-900/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-emerald-400" />
                          {formatDateString(date)}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {dateSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-2 rounded bg-background/50"
                          >
                            <div className="flex items-center">
                              <div className="bg-emerald-900/20 p-1.5 rounded-full mr-2">
                                <Clock className="h-3 w-3 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {formatTimeString(slot.startTime)} -{" "}
                                  {formatTimeString(slot.endTime)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {slot.appointment ? "Booked" : "Available"}
                                </p>
                              </div>
                            </div>
                            {!slot.appointment && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingSlot}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                {deletingSlot ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Availability for Specific Date
            </Button>
          </>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 border border-emerald-900/20 rounded-md p-4"
          >
            <h3 className="text-lg font-medium text-white mb-2">
              Set Availability for Specific Date
            </h3>

            <div className="space-y-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">Select Date</Label>
                <Input
                  id="date"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  {...register("date", {
                    required: "Date is required",
                  })}
                  className="bg-background border-emerald-900/20"
                />
                {errors.date && (
                  <p className="text-sm font-medium text-red-500">
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register("startTime", {
                      required: "Start time is required",
                    })}
                    className="bg-background border-emerald-900/20"
                  />
                  {errors.startTime && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register("endTime", { 
                      required: "End time is required" 
                    })}
                    className="bg-background border-emerald-900/20"
                  />
                  {errors.endTime && (
                    <p className="text-sm font-medium text-red-500">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={savingSlots}
                className="border-emerald-900/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingSlots}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {savingSlots ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Availability"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 p-4 bg-muted/10 border border-emerald-900/10 rounded-md">
          <h4 className="font-medium text-white mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-emerald-400" />
            How Date-Specific Availability Works
          </h4>
          <p className="text-muted-foreground text-sm">
            Set your availability for specific dates. Each date can have its own
            working hours. Default times are 9:30 AM to 3:30 PM, but you can customize
            them for each date. You can only set one availability slot per date.
            Existing booked appointments will not be affected when you delete availability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
