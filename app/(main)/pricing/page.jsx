import Pricing from "@/components/Pricing";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

const PricingPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* back btn */}
      <div className="flex justify-start mb-2 mt-10">
        <Link
          href="/"
          className="flex items-center text-muted-foreground 
            hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
      <div className="max-w-full mx-auto mb-12 text-center">
        <Badge
          variant="outline"
          className=" bg-emarald-900/30 border-emarald-700/30 px-4 py-1 
                text-emerald-400 text-sm font-medium mb-4"
        >
          Affordable Healthcare
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
            simple, transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect consultation package that fits ypur Healthcare 
          needs with no hidden fees pr long-term commitments
        </p>
      </div>
      <Pricing/>

      <div className="max-w-3xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
            Questions? we are here to Help
        </h2>
        <p className="text-muted-foreground mb-4">
            Contact our support team ------
        </p>

      </div>
    </div>
  );
};

export default PricingPage;
