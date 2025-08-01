//component to select the slot for booking appointment(would show the multiple slots  that are available)

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

//would show the tabs for the next four days with the first day(today) tab as default and there we can see the slots available
const SlotPicker= ({ days, onSelectSlot }) => {
  const [selectedSlot, setSelectedSlot] = useState(null); //for the selected slot

  // Find first day with slots as default tab: show the first day in the tab with the active slots there
  const firstDayWithSlots =
    days.find((day) => day.slots.length > 0)?.date || days[0]?.date;
  //for setting the currently active tab: initially the first tab would be active
    const [activeTab, setActiveTab] = useState(firstDayWithSlots);

  const handleSlotSelect = (slot) => { //for the slot selection
    setSelectedSlot(slot);
  };

  const confirmSelection = () => { //confirming the slot selection and would trigger the fn here (present in the doctor-profile and hence the slot is used there)
    if (selectedSlot) {
      onSelectSlot(selectedSlot);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={activeTab} //default tab
        onValueChange={setActiveTab} //onclicking the tab,setting it as active
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {days.map((day) => (
            <TabsTrigger
              key={day.date}
              value={day.date}
              disabled={day.slots.length === 0} //disabled if there is no slots availability in the tab(in the day)
              className={
                day.slots.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <div className="flex gap-2">
                {/* in the tab trigger (basic tab we see initially) would show the day and the slots : in the main content on the tab,shows the slots */}
                <div className=" opacity-80">
                  {format(new Date(day.date), "MMM d")}
                </div>
                <div>({format(new Date(day.date), "EEE")})</div>
              </div>
              {day.slots.length > 0 && (
                <div className="ml-2 bg-emerald-900/30 text-emerald-400 text-xs px-2 py-1 rounded">
                  {day.slots.length}
                </div>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

       {/* content on the tab(slots to be able to be booked) */}
        {days.map((day) => (
          <TabsContent key={day.date} value={day.date} className="pt-4">
            {day.slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available slots for this day.
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white mb-2">
                  {day.displayDate}
                </h3>

                {/* the slots on that day */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {day.slots.map((slot) => (
                    <Card
                      key={slot.startTime}
                      className={`border-emerald-900/20 cursor-pointer transition-all ${
                        selectedSlot?.startTime === slot.startTime
                          ? "bg-emerald-900/30 border-emerald-600"
                          : "hover:border-emerald-700/40"
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <CardContent className="p-3 flex items-center">
                        <Clock
                          className={`h-4 w-4 mr-2 ${
                            selectedSlot?.startTime === slot.startTime
                              ? "text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={
                            selectedSlot?.startTime === slot.startTime
                              ? "text-white"
                              : "text-muted-foreground"
                          }
                        >  
                        {/* the time slot */}
                          {format(new Date(slot.startTime), "h:mm a")} 
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        {/* the button to confirm the selection of the slot and continue to show the form to set the appointment */}
        <Button
          onClick={confirmSelection}
          disabled={!selectedSlot}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default SlotPicker