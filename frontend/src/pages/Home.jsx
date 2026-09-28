// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Small inline icons (no extra library needed).
const icons = {
  key: "M15 7a4 4 0 11-3.9 4.9L4 19v2h3v-2h2v-2h2l1.6-1.6A4 4 0 0115 7z",
  refresh: "M4 4v6h6M20 20v-6h-6M20 10a8 8 0 00-14-3M4 14a8 8 0 0014 3",
  chat: "M4 5h16v11H9l-5 4V5z",
};

// Change this text to describe your real product.
const highlights = [
  {
    icon: "key",
    title: "One account for everything",
    text: "Register once and use the same login across every page of the site.",
  },
  {
    icon: "refresh",
    title: "Your session stays put",
    text: "Refresh the page or open a new tab and you are still signed in. Logout ends it everywhere.",
  },
  {
    icon: "chat",
    title: "Questions get answers",
    text: "Send us a message from the Contact page and we reply within one business day.",
  },
];

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={icons[name]} />
  </svg>
);

const primaryBtn =
  "inline-block px-7 py-3.5 rounded-full text-white font-semibold bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 hover:-translate-y-0.5 transition";

function Home() {
  // isAuthenticated is true when someone is logged in; user holds { name, email }.
  const { isAuthenticated, user } = useAuth();
  const name = user?.name || "friend";

  return (
    <div className="relative overflow-hidden">
      {/* Motion is limited to the hero orbs and the floating card. */}
      <style>{`
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(30px,-24px) scale(1.08);} }
        @keyframes bob { 0%,100% { transform: translateY(0) rotate(-2deg);} 50% { transform: translateY(-14px) rotate(-2deg);} }
        @media (prefers-reduced-motion: reduce) { .drift, .bob { animation: none !important; } }
      `}</style>

      {/* Background glow */}
      <div aria-hidden="true" className="drift absolute -top-32 -left-24 w-96 h-96 rounded-full bg-red-400/30 blur-3xl" style={{ animation: "drift 12s ease-in-out infinite" }} />
      <div aria-hidden="true" className="drift absolute top-40 -right-24 w-96 h-96 rounded-full bg-rose-300/40 blur-3xl" style={{ animation: "drift 15s ease-in-out infinite reverse" }} />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="py-16 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-gray-900">
              {isAuthenticated ? (
                <>
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">{name}.</span>
                </>
              ) : (
                "Everything your team needs, in one place."
              )}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
              {isAuthenticated
                ? "You are signed in. Pick up where you left off, or find out more about us."
                : "Create a free account in under a minute, then sign in from any device."}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              {isAuthenticated ? (
                <Link to="/Contact" className={primaryBtn}>Contact us</Link>
              ) : (
                <Link to="/login" className={primaryBtn}>Create an account</Link>
              )}
              <Link to="/About" className="font-semibold text-gray-900 underline decoration-red-500 decoration-2 underline-offset-8 hover:text-red-600 transition">
                About us
              </Link>
            </div>
          </div>

          {/* Floating account card */}
          <div className="hidden md:flex justify-center" aria-hidden="true">
            <div className="bob w-80 rounded-3xl bg-white/80 backdrop-blur border border-white shadow-2xl shadow-red-900/10 p-6" style={{ animation: "bob 6s ease-in-out infinite" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-rose-400 text-white flex items-center justify-center font-bold text-lg">
                  {isAuthenticated ? name[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{isAuthenticated ? name : "Your account"}</p>
                  <p className="text-sm text-gray-500">{isAuthenticated ? user?.email : "Not signed in yet"}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-3 rounded-full bg-gray-100" />
                <div className="h-3 w-4/5 rounded-full bg-gray-100" />
                <div className="h-3 w-3/5 rounded-full bg-red-100" />
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-green-700">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                {isAuthenticated ? "Session active" : "Ready when you are"}
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="grid gap-6 md:grid-cols-3 pb-20">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-3xl bg-white p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-red-900/10 hover:-translate-y-1 transition">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <Icon name={item.icon} />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        {/* Closing band */}
        <section className="relative overflow-hidden mb-20 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-red-950 text-white px-8 md:px-12 py-12 md:flex md:items-center md:justify-between gap-6">
          <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-red-600/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Not sure where to start?</h2>
            <p className="mt-2 text-gray-300">Tell us what you need and we will point you the right way.</p>
          </div>
          <Link to="/Contact" className={`relative mt-6 md:mt-0 shrink-0 ${primaryBtn}`}>
            Send a message
          </Link>
        </section>
      </div>
    </div>
  );
}

export default Home;