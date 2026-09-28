// src/pages/About.jsx

// Replace these placeholder names and roles with your real team.
const values = [
  {
    title: "Keep it simple",
    text: "If a step is not needed, we remove it. Fewer clicks, fewer mistakes.",
  },
  {
    title: "Be straight with people",
    text: "We say what a feature does and what it does not do, and we fix our mistakes in the open.",
  },
  {
    title: "Protect what is yours",
    text: "Passwords are never stored as plain text, and we only keep the data we need.",
  },
];

const team = [
  { name: "Asha Rao", role: "Founder", tone: "from-red-600 to-rose-400" },
  { name: "Ravi Kumar", role: "Engineering", tone: "from-gray-900 to-gray-600" },
  { name: "Meena Iyer", role: "Design", tone: "from-rose-500 to-orange-400" },
  { name: "Arjun Nair", role: "Support", tone: "from-red-800 to-red-500" },
];

// "Asha Rao" -> "AR"
const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

function About() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-red-300/30 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Heading */}
        <header className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
            About{" "}
            <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">us</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-xl">
            We build tools that are easy to start with and hard to outgrow.
          </p>
        </header>

        {/* Story */}
        <section className="mt-20 grid gap-8 md:grid-cols-3 items-start">
          <h2 className="text-3xl font-bold text-gray-900 md:sticky md:top-24">How we started</h2>
          <div className="md:col-span-2 rounded-3xl bg-white border border-gray-100 shadow-sm p-8 md:p-10 space-y-5 text-lg text-gray-600 leading-relaxed">
            <p>
              The company began as a small side project between a few friends who were tired of
              clumsy software. We wanted sign-up that took seconds and pages that made sense the
              first time you opened them.
            </p>
            <p className="border-l-4 border-red-600 pl-5 text-gray-900 font-medium">
              Today a small team looks after the whole product, from the login screen to the
              support inbox. We still read every message that comes in.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900">What we care about</h2>
          <dl className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-3xl bg-gradient-to-br from-white to-red-50 border border-red-100 p-7 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/10 transition"
              >
                <dt className="text-xl font-bold text-gray-900">{v.title}</dt>
                <dd className="mt-3 text-gray-600 leading-relaxed">{v.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Team */}
        <section className="mt-20 rounded-3xl bg-gray-900 text-white p-8 md:p-12">
          <h2 className="text-3xl font-bold">The people behind it</h2>
          <ul className="mt-10 grid gap-8 grid-cols-2 md:grid-cols-4">
            {team.map((person) => (
              <li key={person.name}>
                <div
                  aria-hidden="true"
                  className={`w-20 h-20 rounded-2xl rotate-3 bg-gradient-to-br ${person.tone} text-white flex items-center justify-center text-2xl font-bold shadow-lg`}
                >
                  {initials(person.name)}
                </div>
                <p className="mt-4 font-semibold">{person.name}</p>
                <p className="text-gray-400">{person.role}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default About;