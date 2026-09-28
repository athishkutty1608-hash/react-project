// src/pages/Login.jsx

// useState lets a component remember data between renders.
import { useState } from "react";

// Navigate redirects the user to another page.
import { Navigate } from "react-router-dom";

// Our own hook from AuthContext (gives us login() and isAuthenticated).
import { useAuth } from "../context/AuthContext";

// NEW: import the backend functions from api.js.
// These send the requests to FastAPI, so this file needs no URLs or axios code.
import { registerUser, loginUser } from "../api/api";

// The starting (empty) values of the form fields.
// Defined outside the component so it is created only once.
const emptyForm = { name: "", email: "", password: "", confirmPassword: "" };

function Login() {
  // mode decides which form is shown: "login" or "register".
  const [mode, setMode] = useState("login");

  // form holds everything the user types in the input fields.
  const [form, setForm] = useState(emptyForm);

  // error holds the red message shown under the fields (empty text = no error).
  const [error, setError] = useState("");

  // NEW: loading is true while we wait for the server to reply.
  // We use it to disable the button so the user cannot click it twice.
  const [loading, setLoading] = useState(false);

  // Get login() (saves the user in AuthContext) and isAuthenticated (true if logged in).
  // Hooks must always be called at the top, before any "if" or "return".
  const { login, isAuthenticated } = useAuth();

  // If the user is already logged in, send them to the home page.
  if (isAuthenticated) return <Navigate to="/" replace />;

  // true when the Register tab is active, false when the Login tab is active.
  const isRegister = mode === "register";

  // Runs every time the user types in any input field.
  // e.target.name  -> the input's name attribute (for example "email")
  // e.target.value -> the text currently typed in that input
  // ...form copies the old values, and [e.target.name]: ... replaces only the
  // one field that changed.
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Switch between Login and Register, and reset the form and any old error.
  const switchMode = (newMode) => {
    setMode(newMode);
    setForm(emptyForm);
    setError("");
  };

  // NEW: "async" lets us use "await" inside this function.
  // "await" pauses until the server replies, without freezing the page.
  const handleSubmit = async (e) => {
    // Stop the browser from reloading the page when the form is submitted.
    e.preventDefault();

    // Clear any old error message before trying again.
    setError("");

    // Validation 1 (Register only): both passwords must match.
    if (isRegister && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return; // stop here, do not contact the server
    }

    // Validation 2: the password must have at least 6 characters.
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // NEW: we are about to contact the server, so show the "loading" state.
    setLoading(true);

    // NEW: try/catch. Run the code in "try". If any request fails,
    // JavaScript jumps to "catch" instead of crashing the app.
    try {
      // If the user is registering, create the account first.
      // We send only the fields the server needs (not confirmPassword).
      if (isRegister) {
        await registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }

      // Log in (this also runs right after a successful registration).
      // axios puts the server's JSON reply inside res.data.
      const res = await loginUser({
        email: form.email,
        password: form.password,
      });

      // Save ONLY the user's profile (name, email...) in AuthContext.
      // Never store the password. res.data.user is what FastAPI sent back.
      // After this, isAuthenticated becomes true, the Navbar shows the Logout
      // button, and the <Navigate> above redirects to the home page.
      login(res.data.user);
    } catch (err) {
      // The interceptor in api.js already turned the server's error into a
      // readable message, so we just show it (for example "Incorrect password").
      setError(err.message);
    } finally {
      // "finally" runs whether the request succeeded or failed.
      // Turn loading off so the button works again.
      setLoading(false);
    }
  };

  // Shared style for all input fields, written once and reused below.
  // w-full               -> full width
  // bg-gray-50 border ... -> light gray background with a thin gray border
  // rounded-xl px-4 py-3  -> rounded corners and space inside
  // outline-none          -> remove the browser's default outline
  // focus:...             -> while typing: white background, red border, soft red ring
  const inputClass =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none transition focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-100";

  return (
    // min-h-[80vh] -> at least 80% of the screen height, so the card sits in the middle.
    // flex items-center justify-center -> center the card both up-down and left-right.
    // relative overflow-hidden -> keep the blurred glow shapes inside this area.
    <div className="relative overflow-hidden min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Two blurred colored circles behind the card (decoration only). */}
      <div aria-hidden="true" className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-red-400/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-rose-300/40 blur-3xl" />

      {/* The card. max-w-md keeps it narrow. bg-white/90 + backdrop-blur give a
          slightly see-through "frosted glass" look. rounded-3xl -> very round corners. */}
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur border border-white shadow-2xl shadow-red-900/10 rounded-3xl p-8 md:p-10">
        {/* Toggle buttons: switch between the Login and Register forms.
            The className changes depending on which mode is active:
            the active button gets the red gradient, the other stays plain. */}
        <div className="flex mb-8 bg-gray-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 py-2.5 rounded-full font-semibold transition ${
              !isRegister
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-600/30"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 py-2.5 rounded-full font-semibold transition ${
              isRegister
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-600/30"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* The heading and the small line under it change with the mode. */}
        <h2 className="text-3xl font-extrabold tracking-tight text-center text-gray-900">
          {isRegister ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-2 mb-8 text-center text-gray-500">
          {isRegister ? "It takes less than a minute." : "Sign in to continue."}
        </p>

        {/* onSubmit runs handleSubmit when the user presses Enter
            or clicks the submit button. */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name field: shown only in Register mode.
              (condition && something) shows "something" only if condition is true.
              aria-label gives screen readers a name, because we use a placeholder
              instead of a visible label. */}
          {isRegister && (
            <input
              type="text"
              name="name" // must match the key in "form", handleChange uses it
              placeholder="Full name"
              aria-label="Full name"
              value={form.name} // the input always shows what is in state
              onChange={handleChange} // update state on every keystroke
              required // the browser blocks submit if this is empty
              className={inputClass}
            />
          )}

          {/* Email field: shown in both modes. type="email" checks the format. */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            aria-label="Email"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />

          {/* Password field: type="password" hides the typed characters. */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            aria-label="Password"
            value={form.password}
            onChange={handleChange}
            required
            className={inputClass}
          />

          {/* Confirm password field: shown only in Register mode. */}
          {isRegister && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              aria-label="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className={inputClass}
            />
          )}

          {/* Show the error message only if there is one.
              role="alert" makes screen readers announce it right away. */}
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </p>
          )}

          {/* disabled={loading} turns the button off while waiting for the server.
              The text also changes so the user knows something is happening. */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 rounded-full text-white font-semibold bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        {/* Text link at the bottom to switch modes. */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="text-red-600 font-semibold hover:underline underline-offset-4"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

// Export the component so App.jsx can use it for the /login route.
export default Login;