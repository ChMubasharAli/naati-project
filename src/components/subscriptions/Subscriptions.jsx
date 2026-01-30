import React, { useState, useEffect } from "react";
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

// Import AOS
import AOS from "aos";
import "aos/dist/aos.css";

const Subscriptions = () => {
  const { user, userLanguage } = useAuth();
  const navigate = useNavigate();
  const [loadingCourseId, setLoadingCourseId] = useState(null);

  // New states for language modals
  const [showLanguageConfirm, setShowLanguageConfirm] = useState(false);
  const [showLanguageInfo, setShowLanguageInfo] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseType, setSelectedCourseType] = useState(null);

  // Initialize AOS with minimal animation
  useEffect(() => {
    AOS.init({
      duration: 300,
      easing: "ease-out",
      once: true,
      mirror: false,
      offset: 50,
    });

    return () => {
      AOS.refresh();
    };
  }, []);

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
        languageId: userLanguage?.id || null,
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

    setSelectedCourse(courseId);
    setSelectedCourseType(courseType);

    if (userLanguage?.id) {
      setShowLanguageConfirm(true);
    } else {
      setShowLanguageInfo(true);
    }
  };

  const handleConfirmPurchase = async () => {
    setShowLanguageConfirm(false);
    await createCheckoutSession(selectedCourse, selectedCourseType);
  };

  return (
    <>
      {/* Confirmation Modal */}
      {showLanguageConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200"
            data-aos="fade-up"
          >
            <button
              onClick={() => setShowLanguageConfirm(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Language Confirmation
              </h3>

              <p className="text-gray-600 mb-6 text-sm md:text-base">
                You have selected{" "}
                <span className="font-bold text-emerald-600">
                  {userLanguage?.name || "Unknown"}
                </span>{" "}
                language.
                <br />
                Do you want to purchase this plan for{" "}
                <span className="font-bold">
                  {userLanguage?.name || "Unknown"}
                </span>
                ?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmPurchase}
                  className="w-full py-3 cursor-pointer bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors duration-300 active:scale-95"
                >
                  Yes, Continue with {userLanguage?.name || "Unknown"}
                </button>

                <button
                  onClick={() => setShowLanguageConfirm(false)}
                  className="w-full py-3 cursor-pointer bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors duration-300 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Popup */}
      {showLanguageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200"
            data-aos="fade-up"
          >
            <button
              onClick={() => setShowLanguageInfo(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Language Required
              </h3>

              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Please choose your preferred language first from your
                Navbar/Sidebar.
                <br />
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Close this popup and set your language first
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50/50 text-gray-900 antialiased overflow-hidden">
        <div className="py-12 md:py-24 px-4 sm:px-6">
          <div className="container mx-auto max-w-7xl">
            {!user && (
              <div
                className="text-center mb-12 md:mb-16 pt-8 md:pt-12"
                data-aos="fade-up"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 md:mb-6">
                  Invest in your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Future
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto px-4">
                  Choose the expert-led program that matches your career goals
                  and timeline. Start your NAATI CCL success story today.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className={`relative flex flex-col bg-white rounded-2xl md:rounded-[2rem] transition-all duration-300 hover:-translate-y-1 ${
                    course.popular
                      ? "ring-1 md:ring-2 ring-emerald-500 shadow-lg md:shadow-[0_20px_50px_rgba(16,185,129,0.15)] md:scale-[1.02] z-10"
                      : "border border-gray-200 shadow-sm hover:shadow-lg"
                  }`}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {course.popular && (
                    <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-1 md:px-5 md:py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="p-6 md:p-8 pb-0">
                    <div className="mb-4 md:mb-6">
                      <h3
                        className={`text-lg md:text-xl font-bold mb-2 ${
                          course.popular ? "text-emerald-600" : "text-gray-900"
                        }`}
                      >
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm md:text-base leading-relaxed min-h-[40px] md:min-h-[48px]">
                        {course.description}
                      </p>
                    </div>

                    <div className="mb-6 md:mb-8 flex items-baseline gap-1">
                      <span className="text-3xl md:text-5xl font-black tracking-tight text-gray-900">
                        {course.price.replace("$", "")}
                      </span>
                      <span className="text-lg md:text-xl font-bold text-gray-400">
                        $
                      </span>
                      <span className="text-gray-400 text-xs md:text-sm ml-2">
                        / total access
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-8">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-gray-700">
                          {course.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100">
                        <Users className="w-3 h-3 md:w-4 md:h-4 text-teal-500" />
                        <span className="text-xs font-bold text-gray-700">
                          {course.students}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 md:px-8 flex-grow">
                    <div className="h-px bg-gray-100 w-full mb-6 md:mb-8" />
                    <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                      {course.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-0.5 md:mt-1 bg-emerald-100 rounded-full p-0.5">
                            <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-xs md:text-sm text-gray-600 font-medium leading-tight">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 md:p-8 pt-0">
                    <button
                      onClick={() => enrollNow(course.id, course.type)}
                      disabled={loadingCourseId !== null}
                      className={`group cursor-pointer relative w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl font-bold text-sm transition-all duration-300 ${
                        course.popular
                          ? "bg-gray-900 text-white shadow-lg hover:shadow-emerald-200"
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
                            className="animate-spin h-4 w-4 md:h-5 md:w-5"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="space-y-8" data-aos="fade-right">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
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
                      <div
                        key={i}
                        className="group flex items-start gap-4 md:gap-6"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-emerald-500 transition-colors duration-300">
                          <item.icon className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
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

                <div className="relative" data-aos="fade-left">
                  <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-2xl md:rounded-[3rem] blur-xl opacity-50 -z-10" />
                  <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl md:shadow-2xl text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <Award className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                      Satisfaction Guarantee
                    </h3>
                    <p className="text-gray-500 mb-6 md:mb-10 leading-relaxed text-sm md:text-base">
                      We stand behind our curriculum. If you aren't satisfied
                      within 30 days, we'll provide a full refund, no questions
                      asked.
                    </p>
                    <div className="grid grid-cols-3 gap-3 md:gap-4 bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-100">
                      <div>
                        <div className="text-xl md:text-2xl font-black text-emerald-600">
                          30
                        </div>
                        <div className="text-[10px] md:text-xs uppercase tracking-tighter font-bold text-gray-400">
                          Days
                        </div>
                      </div>
                      <div className="border-x border-gray-200">
                        <div className="text-xl md:text-2xl font-black text-emerald-600">
                          95%
                        </div>
                        <div className="text-[10px] md:text-xs uppercase tracking-tighter font-bold text-gray-400">
                          Pass
                        </div>
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-black text-emerald-600">
                          4.9
                        </div>
                        <div className="text-[10px] md:text-xs uppercase tracking-tighter font-bold text-gray-400">
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
