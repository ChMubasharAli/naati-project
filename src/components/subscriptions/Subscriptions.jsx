import React, { useState } from "react";
import {
  BookOpen,
  Video,
  Users,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../api/axios";

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingCourseId, setLoadingCourseId] = useState(null);

  const courses = [
    {
      id: 1,
      title: "NAATI CCL Foundation",
      price: "25$",
      duration: "4 weeks",
      level: "Beginner",
      students: "1,200+",
      description: "Perfect for beginners starting their NAATI CCL journey",
      features: [
        "20+ video lessons",
        "Basic interpreting techniques",
        "Cultural awareness training",
        "Practice dialogues",
        "1-on-1 mentoring session",
      ],
      type: "one",
    },
    {
      id: 2,
      title: "NAATI CCL Intensive",
      price: "60$",
      duration: "8 weeks",
      level: "Intermediate",
      students: "2,500+",
      description: "Comprehensive course for serious CCL candidates",
      features: [
        "50+ video lessons",
        "Advanced interpreting strategies",
        "Mock exams with feedback",
        "Expert instructor support",
        "Weekly live Q&A sessions",
        "Unlimited practice access",
      ],
      popular: true,
      type: "two",
    },
    {
      id: 3,
      title: "NAATI CCL Masterclass",
      price: "99$",
      duration: "12 weeks",
      level: "Advanced",
      students: "800+",
      description: "Complete mastery program with guaranteed results",
      features: [
        "100+ video lessons",
        "Personal study plan",
        "One-on-one coaching",
        "Exam day strategy",
        "Lifetime course access",
        "Money-back guarantee",
      ],
      type: "three",
    },
  ];

  const createCheckoutSession = async (courseId, courseType) => {
    try {
      setLoadingCourseId(courseId);
      const response = await apiClient.post("/api/v1/stripe/checkout/session", {
        type: courseType,
        userId: user?.id || null,
      });

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch {
      toast.error("Payment gateway error. Please try again.");
    } finally {
      setLoadingCourseId(null);
    }
  };

  const enrollNow = async (courseId, courseType) => {
    if (!user) {
      navigate("/login");
      return;
    }
    await createCheckoutSession(courseId, courseType);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 text-gray-900  antialiased">
        <div className="py-24 px-6">
          <div className="container mx-auto max-w-7xl">
            {!user && (
              <div className="text-center mb-16 pt-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 mb-6">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-700">
                    Transparent Pricing
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                  Invest in your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Future
                  </span>
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Choose the expert-led program that matches your career goals
                  and timeline. Start your NAATI CCL success story today.
                </p>
              </div>
            )}

            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                user?.id ? "lg:grid-cols-2 xl:grid-cols-3 " : "lg:grid-cols-3"
              } gap-8 mb-24 items-end`}
            >
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`relative flex flex-col bg-white rounded-[2rem] transition-all duration-500 hover:-translate-y-2 ${
                    course.popular
                      ? "ring-2 ring-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.15)] scale-105 z-10"
                      : "border border-gray-200 shadow-sm hover:shadow-xl"
                  }`}
                >
                  {course.popular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="p-8 pb-0">
                    <div className="mb-6">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          course.popular ? "text-emerald-600" : "text-gray-900"
                        }`}
                      >
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed min-h-[40px]">
                        {course.description}
                      </p>
                    </div>

                    <div className="mb-8 flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight text-gray-900">
                        {course.price.replace("$", "")}
                      </span>
                      <span className="text-xl font-bold text-gray-400">$</span>
                      <span className="text-gray-400 text-sm ml-2">
                        / total access
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-gray-700">
                          {course.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <Users className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-bold text-gray-700">
                          {course.students}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 flex-grow">
                    <div className="h-px bg-gray-100 w-full mb-8" />
                    <ul className="space-y-4 mb-8">
                      {course.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="mt-1 bg-emerald-100 rounded-full p-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium leading-tight">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 pt-0">
                    <button
                      onClick={() => enrollNow(course.id, course.type)}
                      disabled={loadingCourseId !== null}
                      className={`group cursor-pointer relative w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all duration-300 overflow-hidden ${
                        course.popular
                          ? "bg-gray-900 text-white shadow-xl hover:shadow-emerald-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                      } ${
                        loadingCourseId !== null
                          ? "opacity-50 cursor-not-allowed"
                          : "active:scale-95"
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loadingCourseId === course.id ? (
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          "Choose Plan"
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!user && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-10">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                    Premium learning <br />
                    <span className="text-emerald-600">
                      without the premium price.
                    </span>
                  </h2>
                  <div className="space-y-6">
                    {[
                      {
                        icon: BookOpen,
                        title: "Expert Curriculum",
                        desc: "Crafted by NAATI veterans for real-world exam conditions.",
                      },
                      {
                        icon: Video,
                        title: "On-Demand Access",
                        desc: "Study anytime, anywhere with our high-definition learning portal.",
                      },
                      {
                        icon: Award,
                        title: "Certified Excellence",
                        desc: "95% first-time pass rate across our entire student base.",
                      },
                    ].map((item, i) => (
                      <div key={i} className="group flex items-start gap-6">
                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-emerald-500 transition-colors duration-300">
                          <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-[3rem] blur-2xl opacity-50 -z-10" />
                  <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Award className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Satisfaction Guarantee
                    </h3>
                    <p className="text-gray-500 mb-10 leading-relaxed text-sm">
                      We stand behind our curriculum. If you aren't satisfied
                      within 30 days, we'll provide a full refund, no questions
                      asked.
                    </p>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <div>
                        <div className="text-2xl font-black text-emerald-600">
                          30
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter font-bold text-gray-400">
                          Days
                        </div>
                      </div>
                      <div className="border-x border-gray-200">
                        <div className="text-2xl font-black text-emerald-600">
                          95%
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter font-bold text-gray-400">
                          Pass
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-emerald-600">
                          4.9
                        </div>
                        <div className="text-[10px] uppercase tracking-tighter font-bold text-gray-400">
                          Stars
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Subscriptions;
