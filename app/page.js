import Pricing from "@/components/Pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { creditBenefits, features, testimonials } from "@/lib/homeData";
import { ArrowRight, Check, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Home = () => {
 
  return (
    <div className="bg-background">
      {/* header */}
      <section className="relative overflow-hidden py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* left side */}
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="bg-emerald-900/30 border-emarald-700/30 py-2 px-4 text-sm font-medium text-emerald-400"
              >
                Healthcare Made Simple
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Connect with Doctors
                <br /> <span className="gradient-title">anytime,anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Book Appointments,consult via video,and manage your healthcare
                journey all in one secure platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 text-white hover:bg-emerald-800"
                >
                  <Link href={"/onboarding"}>
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />{" "}
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-emerald-700/30 hover:bg-muted/80"
                >
                  <Link href={"/doctors"}>Find Doctors</Link>
                </Button>
              </div>
            </div>
            {/* right side */}
            <div className="relative h-[400px] lg:h-[500px] overflow-hidden rounded-xl ">
              <Image
                src="/banner2.png"
                alt="Doctor Consultation"
                fill
                priority
                className="object-cover md:pt-14 rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* main features section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 ">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 ">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes healthcare accessible with just a few clicks
            </p>
          </div>
          {/* features */}
          <div className="grid grid-cols-1 mg:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              return (
                <Card
                  key={index}
                  className="border-emerald-900/20 hover:border-emarals-700/40 transition-all duration-300 bg-black/50"
                >
                  <CardHeader className="pb-2">
                    <div className="bg-emerald-900/20 p-3 rounded-lg w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* pricing section */}

      <section className="py-20 ">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-900/30 border-emarald-700/30 py-1 px-4 text-sm font-medium text-emerald-400"
            >
              Affordable Healthcare
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 ">
              Consultation packages
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect consultation package that fits your healthcare
              needs
            </p>
          </div>
          {/* pricing table */}
          <Pricing/>

          <div>
            <Card className="mt-12 bg-muted/20 border-emarald-900/30">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white flex flex-items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-emerald-400" />
                  How Our credit system works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {creditBenefits.map((benefit, index) => {
                    return (
                      <li key={index} className="flex items-start">
                        <div className="mr-3 mt-1 bg-emerald-900/20 p-1 rounded-full">
                          <Check className="h-4 w-4 text-emerald-400" />
                        </div>
                        {/* the data contains strong tag, to convert it to proper html with thestyle, used dangerouslySetInnerHTML */}
                        <p
                          className="text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: benefit }}
                        />
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 ">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-emerald-900/30 border-emarald-700/30 py-1 px-4 text-sm font-medium text-emerald-400"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 ">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from patients and doctors who use our platform
            </p>
          </div>

          {/* testimonials */}
          <div className="grid grid-cols-1 mg:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => {
              return (
                <Card
                  key={index}
                  className="border-emerald-900/20 hover:border-emarals-700/40 transition-all duration-300 bg-black/50"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center mr-4">
                        <span className="text-emerald-400 font-bold">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {testimonial.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      &quot;{testimonial.quote}&quot;
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* call to action */}
      <section className="py-20">
        <div className="container mx-auto px-4 ">
          <Card className="bg-gradient-to-r from-emerald-900/30  to-emerald-950/20 border-emarald-800/20">
            <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to take control of your healthcare
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of users who have simplifies there healthcare
                  journey with our platform. Get Started today and experience
                  healthcare the way it should be.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 text-white hover:bg-emerald-800"
                  >
                    <Link href="/sign-up">Sign up now</Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-emerald-700/30 hover:bg-muted/80"
                  >
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
