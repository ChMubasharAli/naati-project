import React from "react";
import {
  BookOpen,
  Video,
  Users,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react";

const Course = () => {
  const courses = [
    {
      id: 1,
      title: "NAATI CCL Foundation Course",
      price: "$299",
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
    },
    {
      id: 2,
      title: "NAATI CCL Intensive Course",
      price: "$599",
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
    },
    {
      id: 3,
      title: "NAATI CCL Masterclass",
      price: "$999",
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
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <div className="py-20 px-6">
        <div className="container mx-auto ">
          {/* Header */}
          <div className="text-center mb-20 pt-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200 mb-6">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                Our Courses
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              NAATI CCL{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                Courses
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Structured learning programs designed by NAATI experts. Choose the
              course that fits your level and timeline.
            </p>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-2xl ${
                  course.popular
                    ? "border-emerald-400 shadow-xl shadow-emerald-100"
                    : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                {course.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Course Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{course.description}</p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-emerald-600">
                        {course.price}
                      </span>
                      <span className="text-gray-500">one-time</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-900">
                        {course.duration}
                      </div>
                      <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <Users className="w-5 h-5 text-teal-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-900">
                        {course.students}
                      </div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-4 font-semibold rounded-xl transition-all ${
                      course.popular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200 hover:scale-105"
                        : "bg-gray-900 text-white hover:bg-gray-800 hover:scale-105"
                    }`}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Why Choose Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2  gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-10">
                Why Choose Our Courses?
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Expert-Designed Curriculum
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Created by certified NAATI interpreters with 10+ years of
                      experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Interactive Learning
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      High-quality video lessons with interactive exercises and
                      real-time feedback.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Proven Results
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      95% of our students pass the NAATI CCL exam on their first
                      attempt.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-10 border-2 border-emerald-200 shadow-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-300">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Satisfaction Guarantee
                </h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                  We're so confident in our courses that we offer a 30-day
                  money-back guarantee. If you're not completely satisfied, get
                  a full refund.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-1">
                      30
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Day Guarantee
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-1">
                      95%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Pass Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-1">
                      4.9
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Average Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;
