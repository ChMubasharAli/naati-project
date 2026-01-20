import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "react-toastify";

// Import AOS
import AOS from "aos";
import "aos/dist/aos.css";
import apiClient from "../../api/axios";

const Contact = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
      offset: 100,
    });

    return () => {
      AOS.refresh();
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/api/v1/contact", formData);

      if (response.status === 200 || response.status === 201) {
        toast.success("Message sent successfully! ");

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          subject: "",
          message: "",
        });
        setErrors({});
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data?.message ||
          "Failed to send message. Please try again.";
        toast.error(errorMessage);
      } else if (error.request) {
        // Request was made but no response
        toast.error(
          "Network error. Please check your connection and try again.",
        );
      } else {
        // Something else happened
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
      `}</style>

      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Animated Gradient Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-float"></div>
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div
            className="text-center mb-20 pt-20"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <h1
              className="text-5xl lg:text-6xl font-bold text-white mb-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Get in{" "}
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                Touch
              </span>
            </h1>
            <p
              className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              Have questions about NAATI CCL preparation? Our expert team is
              here to help you succeed. Reach out for personalized guidance and
              support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div
              className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <h2
                className="text-2xl font-bold text-white mb-8"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <div data-aos="fade-up" data-aos-delay="350">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="off"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.firstName
                          ? "border-red-500/50"
                          : "border-white/10"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div data-aos="fade-up" data-aos-delay="400">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="off"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.lastName
                          ? "border-red-500/50"
                          : "border-white/10"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div data-aos="fade-up" data-aos-delay="450">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="off"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.email ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div data-aos="fade-up" data-aos-delay="500">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    autoComplete="off"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g., +61 400 111 222"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.phoneNumber
                        ? "border-red-500/50"
                        : "border-white/10"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                <div data-aos="fade-up" data-aos-delay="550">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    autoComplete="off"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What can we help you with?"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.subject ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div data-aos="fade-up" data-aos-delay="600">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    autoComplete="off"
                    placeholder="Tell us more about your questions or needs..."
                    rows={5}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none ${
                      errors.message ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`group w-full py-4 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  data-aos="fade-up"
                  data-aos-delay="700"
                  data-aos-anchor-placement="top-bottom"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <div
                className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8"
                data-aos="fade-left"
                data-aos-delay="100"
              >
                <h3
                  className="text-xl font-bold text-white mb-6"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <div
                    className="flex items-start gap-4"
                    data-aos="fade-left"
                    data-aos-delay="250"
                  >
                    <div
                      className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                      data-aos="zoom-in"
                      data-aos-delay="300"
                    >
                      <MapPin className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Office Address
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Level 5, 123 Collins Street
                        <br />
                        Melbourne VIC 3000, Australia
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4"
                    data-aos="fade-left"
                    data-aos-delay="350"
                  >
                    <div
                      className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                      data-aos="zoom-in"
                      data-aos-delay="400"
                    >
                      <Phone className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Phone Number
                      </p>
                      <p className="text-slate-400">+61 3 9000 0000</p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4"
                    data-aos="fade-left"
                    data-aos-delay="450"
                  >
                    <div
                      className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                      data-aos="zoom-in"
                      data-aos-delay="500"
                    >
                      <Mail className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Email Address
                      </p>
                      <p className="text-slate-400">support@prepsmart.au</p>
                    </div>
                  </div>

                  <div
                    className="flex items-start gap-4"
                    data-aos="fade-left"
                    data-aos-delay="550"
                  >
                    <div
                      className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                      data-aos="zoom-in"
                      data-aos-delay="600"
                    >
                      <Clock className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Business Hours
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Saturday: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Card */}
              <div
                className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8"
                data-aos="fade-left"
                data-aos-delay="100"
              >
                <h3
                  className="text-xl font-bold text-white mb-6"
                  data-aos="fade-up"
                  data-aos-delay="200"
                >
                  Frequently Asked
                </h3>
                <div className="space-y-6">
                  <div
                    className="pb-6 border-b border-white/10 last:border-0 last:pb-0"
                    data-aos="fade-left"
                    data-aos-delay="250"
                  >
                    <p className="font-semibold text-white mb-2">
                      How long does it take to prepare for NAATI CCL?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Most students prepare for 2-3 months with our structured
                      courses.
                    </p>
                  </div>
                  <div
                    className="pb-6 border-b border-white/10 last:border-0 last:pb-0"
                    data-aos="fade-left"
                    data-aos-delay="350"
                  >
                    <p className="font-semibold text-white mb-2">
                      Do you offer refunds?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Yes, we offer a 30-day money-back guarantee on all
                      courses.
                    </p>
                  </div>
                  <div
                    className="pb-6 border-b border-white/10 last:border-0 last:pb-0"
                    data-aos="fade-left"
                    data-aos-delay="450"
                  >
                    <p className="font-semibold text-white mb-2">
                      Can I get one-on-one coaching?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Yes, personalized coaching is available with our premium
                      packages.
                    </p>
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

export default Contact;
