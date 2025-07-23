import React from "react";
import { Card, CardContent } from "./ui/card";
import { PricingTable } from "@clerk/nextjs";

const Pricing = () => {
  return (
    <Card className="border-emerald-900/30 shadow-lg bg-gradient-to-b  from-emarald-950 to-transparent">
      <CardContent className="p-6 md:p-8">
        <PricingTable checkoutProps={{appearance:{
            elements:{
                drawRoot:{
                    zIndex:200,
                }
            }
        }}}/>
      </CardContent>
    </Card>
  );
};

export default Pricing;
