import React, { useEffect } from "react";
import "aos/dist/aos.css";
import AOS from "aos";
import {
  CheckCircle,
  Star,
  Users,
  Brain,
  Clock,
  Award,
  BarChart3,
  Zap,
  Shield,
  Play,
  Trophy,
  ArrowRight,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Home = ({ onStartPractice = () => {} }) => {
  // Initialize AOS on component mount
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
      offset: 100,
    });

    // Refresh AOS when component updates
    return () => {
      AOS.refresh();
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Scoring",
      description:
        "Get instant feedback with advanced AI that evaluates your performance accurately.",
    },
    {
      icon: Clock,
      title: "Real-Time Practice",
      description:
        "Practice with authentic NAATI CCL scenarios in simulated exam conditions.",
    },
    {
      icon: Award,
      title: "Guaranteed Results",
      description:
        "95% of students achieve their target scores with our proven methodology.",
    },
  ];

  const benefits = [
    "Unlimited practice sessions",
    "Instant AI feedback",
    "Real exam scenarios",
    "Progress tracking",
    "Mobile-friendly",
    "Expert curriculum",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased overflow-hidden">
      {/* HERO SECTION - DARK */}
      <section
        className="relative min-h-screen flex items-center justify-center px-6 py-32 overflow-hidden bg-slate-950"
        data-aos="fade-in"
        data-aos-delay="100"
      >
        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950"></div>

        {/* Noise Overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url('https://grainy-gradients.vercel.app/noise.svg')",
          }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating Glow Orbs */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[160px] animate-float-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[160px] animate-float-slower"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div
            className="text-center space-y-10"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {/* Heading */}
            <h1
              className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <span className="block text-white">Ace Your NAATI CCL</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent animate-gradient">
                with AI Precision
              </span>
            </h1>

            {/* Subheading */}
            <p
              className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              Transform your preparation with intelligent feedback, real-time
              scoring, and personalized insights. Join 100,000+ students who
              mastered their exam.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap justify-center gap-6 pt-6"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <button
                onClick={onStartPractice}
                className="group relative px-10 py-5 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <Link to="/login" className="relative flex items-center gap-3">
                  <Play size={20} fill="currentColor" />
                  Start Free Practice
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </button>

              <button
                className="px-10 cursor-pointer py-5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 text-white font-semibold rounded-full transition-all"
                onClick={() =>
                  document
                    .getElementById("video-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-20 max-w-3xl mx-auto"
              data-aos="fade-up"
              data-aos-delay="600"
            >
              {[
                {
                  icon: Users,
                  value: "100K+",
                  label: "Active Students",
                  color: "emerald",
                },
                {
                  icon: Trophy,
                  value: "95%",
                  label: "Success Rate",
                  color: "teal",
                },
                {
                  icon: Brain,
                  value: "AI",
                  label: "Powered",
                  color: "emerald",
                },
              ].map(({ icon: Icon, value, label, color }, index) => (
                <div
                  key={label}
                  className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all hover:-translate-y-1"
                  data-aos="fade-up"
                  data-aos-delay={700 + index * 100}
                >
                  <Icon className={`w-8 h-8 text-${color}-400 mb-3 mx-auto`} />
                  <div className="text-4xl font-bold text-white mb-1">
                    {value}
                  </div>
                  <div className="text-sm text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - LIGHT */}
      <section className="relative py-32 px-6 bg-white" data-aos="fade-up">
        <div className="container mx-auto max-w-6xl">
          <div
            className="md:text-center mb-20"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <h2
              className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Everything you need to succeed
            </h2>
            <p
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              Advanced tools designed to accelerate your NAATI CCL preparation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500"
                data-aos="fade-up"
                data-aos-delay={400 + index * 100}
                data-aos-anchor-placement="top-bottom"
              >
                <div className="absolute inset-0 bg-linear-to-br from-emerald-50 to-teal-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div
                    className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-200"
                    data-aos="zoom-in"
                    data-aos-delay={500 + index * 100}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION - DARK */}
      <section className="relative py-32 px-6 bg-slate-900" data-aos="fade-up">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div
              className="space-y-8"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <h3
                className="text-5xl font-bold text-white leading-tight"
                data-aos="fade-right"
                data-aos-delay="200"
              >
                Your path to NAATI CCL success
              </h3>

              <div
                className="grid sm:grid-cols-2 gap-4"
                data-aos="fade-right"
                data-aos-delay="300"
              >
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all"
                    data-aos="fade-right"
                    data-aos-delay={400 + index * 50}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to={"/login"}
                className="group w-fit px-10 py-5 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-full transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
                data-aos="fade-right"
                data-aos-delay="700"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div
              className="space-y-6"
              data-aos="fade-left"
              data-aos-delay="100"
            >
              <div
                className="relative p-4 bg-linear-to-br from-emerald-500 to-teal-500 rounded-3xl shadow-2xl shadow-emerald-500/50 overflow-hidden"
                data-aos="zoom-in"
                data-aos-delay="200"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative space-y-6">
                  <div className="flex items-center gap-2">
                    <Star
                      className="w-6 h-6 text-yellow-300"
                      fill="currentColor"
                    />
                    <span className="text-sm font-bold uppercase tracking-wider text-white/90">
                      Score Guarantee
                    </span>
                  </div>
                  <h4 className="text-4xl font-bold text-white">
                    Guaranteed Results
                  </h4>
                  <p className="text-emerald-50 text-lg leading-relaxed">
                    We coach you until you achieve your desired NAATI score with
                    our proven methodology and expert support.
                  </p>
                  <div className="flex gap-12 pt-4">
                    <div>
                      <div className="text-5xl font-bold text-white">95%</div>
                      <div className="text-sm text-emerald-100 mt-1">
                        Success Rate
                      </div>
                    </div>
                    <div>
                      <div className="text-5xl font-bold text-white">100K+</div>
                      <div className="text-sm text-emerald-100 mt-1">
                        Students
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-3 gap-4"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                {[
                  { icon: BarChart3, label: "Analytics" },
                  { icon: Zap, label: "Real-time" },
                  { icon: Shield, label: "Secure" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center hover:bg-white/10 hover:border-emerald-500/30 transition-all"
                    data-aos="fade-up"
                    data-aos-delay={400 + i * 100}
                  >
                    <item.icon className="w-7 h-7 text-emerald-400 mx-auto mb-3" />
                    <div className="text-sm font-semibold text-slate-300">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO SECTION - LIGHT */}
      <section
        id="video-section"
        className="relative py-32 px-6 bg-white"
        data-aos="fade-up"
      >
        <div className="container mx-auto max-w-6xl">
          <div
            className="md:text-center mb-20"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <h2
              className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              See how it works
            </h2>
            <p
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              Discover our structured approach to NAATI CCL success
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className="relative group"
              data-aos="fade-right"
              data-aos-delay="400"
            >
              <div className="absolute inset-0 bg-linear-to-r from-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-slate-100 shadow-2xl">
                <iframe
                  src="https://www.youtube.com/embed/CvK2AanVS4Q?autoplay=0&mute=1"
                  title="NAATI CCL Course Overview"
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </div>

            <div
              className="space-y-6"
              data-aos="fade-left"
              data-aos-delay="400"
            >
              <h3 className="text-[33px] text-center font-bold text-slate-900 leading-tight">
                Structured learning for guaranteed success
              </h3>
              <div className="space-y-4">
                {[
                  "Complete domain coverage across healthcare, legal, and more",
                  "AI scoring that simulates actual exam conditions",
                  "Proven methodology backed by expert strategies",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start p-5 bg-slate-50 rounded-2xl border border-slate-200"
                    data-aos="fade-left"
                    data-aos-delay={500 + i * 100}
                  >
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/subscriptions"
                className="px-10 py-5 inline-block bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                data-aos="fade-up"
                data-aos-delay="800"
              >
                Explore Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - DARK */}
      <section
        className="relative py-40 px-6 bg-slate-950 overflow-hidden"
        data-aos="fade-up"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-float"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto max-w-5xl md:text-center relative z-10">
          <div className="space-y-10" data-aos="fade-up" data-aos-delay="100">
            <h2
              className="text-4xl lg:text-7xl font-bold text-white leading-tight"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Ready to ace your
              <br />
              NAATI CCL exam?
            </h2>

            <p
              className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              Join thousands of successful students. Start practicing with
              AI-powered feedback today.
            </p>

            <div
              className="flex flex-wrap justify-center gap-4 pt-6"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <button
                onClick={onStartPractice}
                className="group cursor-pointer relative px-14 py-6 bg-linear-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50"
              >
                <div className="absolute inset-0 animate-shimmer"></div>
                <Link
                  to={"/login"}
                  className="relative flex items-center gap-3"
                >
                  Start Free Practice
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Link>
              </button>

              <button
                className="px-14 cursor-pointer py-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 text-white text-xl font-bold rounded-full transition-all"
                onClick={() =>
                  document
                    .getElementById("video-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn More
              </button>
            </div>

            <div
              className="flex flex-col md:flex-row flex-wrap justify-center gap-8 pt-12"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <div
                className="flex items-center gap-3 text-slate-400"
                data-aos="fade-up"
                data-aos-delay="600"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">
                  No credit card required
                </span>
              </div>
              <div
                className="flex items-center gap-3 text-slate-400"
                data-aos="fade-up"
                data-aos-delay="700"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">Free trial included</span>
              </div>
              <div
                className="flex items-center gap-3 text-slate-400"
                data-aos="fade-up"
                data-aos-delay="800"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - DARK */}
      {/* <Footer /> */}
    </div>
  );
};

export default Home;
