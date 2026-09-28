// src/pages/Contact.jsx
import { useState } from "react";

const emptyForm = { name: "", email: "", message: "" };

// Replace with your real details.
const details = [
  { label: "Email", value: "hello@company.com", icon: "M3 6h18v12H3zM3 7l9 7 9-7" },
  { label: "Phone", value: "+91 98765 43210", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" },
  { label: "Address", value: "12 Main Street, Colachel, Tamil Nadu", icon: "M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" },
  { label: "Hours", value: "Monday to Friday, 9am to 6pm", icon: "M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z" },
];

function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [sent, setSent] = useState(false);

  // Update only the field that changed (uses the input's name attribute).
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSent(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: send the message to your backend, for example:
    // await API.post("/contact", form)
    // For now the message is only cleared and a confirmation is shown.
    setForm(emptyForm);
    setSent(true);
  };

  const inputClass =
    "mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none transition focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-100";

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-rose-300/30 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
        <header className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            Contact{" "}
            <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">us</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-xl">
            Have a question or an idea? Write to us and we will reply within one business day.
          </p>
        </header>

        <div className="mt-14 grid gap-8 md:grid-cols-5">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="md:col-span-3 flex flex-col gap-5 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-red-900/5 p-8 md:p-10"
          >
            {sent && (
              <p role="status" className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-3 font-medium">
                Message sent. We will reply within one business day.
              </p>
            )}

            <div>
              <label htmlFor="name" className="font-semibold text-gray-900">Your name</label>
              <input id="name" type="text" name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label htmlFor="email" className="font-semibold text-gray-900">Email</label>
              <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label htmlFor="message" className="font-semibold text-gray-900">How can we help?</label>
              <textarea id="message" name="message" rows="5" value={form.message} onChange={handleChange} required className={inputClass} />
            </div>

            <button
              type="submit"
              className="self-start px-8 py-3.5 rounded-full text-white font-semibold bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              Send message
            </button>
          </form>

          {/* Contact details */}
          <dl className="md:col-span-2 rounded-3xl bg-gradient-to-br from-gray-900 to-red-950 text-white p-8 md:p-10 space-y-7 self-start">
            {details.map((item) => (
              <div key={item.label} className="flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-white/10 text-red-300 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div>
                  <dt className="font-semibold">{item.label}</dt>
                  <dd className="mt-1 text-gray-300">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

export default Contact;