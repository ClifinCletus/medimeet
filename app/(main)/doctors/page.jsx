import { Card, CardContent } from "@/components/ui/card";
import { SPECIALTIES } from "@/lib/specialities";
import Link from "next/link";
import React from "react";

//here displays all the specialty card and on click of it move to [speciality] page.jsx where shows the doctors in that specialty
const SpecialitiesPage = () => {
  return (
    <>
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 gradient-title">Find Your Doctor</h1>
        <p className="text-muted-foreground text-lg">
          Browse by speciality or view all available healthcare providers
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {SPECIALTIES.map((speciality) => (
          <Link key={speciality.name} href={`/doctors/${speciality.name}`}>
            <Card className="hover:border-emerald-700/20 transition-all cursor-pointer border-emarals-900/20 h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                  <div>{speciality.icon}</div>
                </div>
                <h3 className="font-medium text-white">{speciality.name}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
};

export default SpecialitiesPage;
