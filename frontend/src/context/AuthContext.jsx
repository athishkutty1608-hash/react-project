// ============================================================
// BIG PICTURE (read this first)
// ============================================================
// Problem: many components (Navbar, Login, LogoutButton, Footer) all need to
// know "who is logged in?". Passing that info through props to every component
// would be messy.
//
// Solution: Context. Think of it as a shared box that sits above your whole app.
// Any component can open the box and read what is inside, no props needed.
//
// This file does 3 things:
//   1. Creates the box                  (createContext)
//   2. Fills the box and manages it     (AuthProvider)
//   3. Gives components an easy way
//      to open the box                  (useAuth)
// ============================================================

// Import the React tools we need. Each one is explained where it is used.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// STEP 1: Create the empty "shared box" (the context).
// null is the default value. It is used only if a component tries to open the
// box while it is NOT inside <AuthProvider>. We use that to show a clear error later.
const AuthContext = createContext(null);

// The name (key) under which we save the user in the browser's localStorage.
// We store it in a constant so we never mistype the name in different places.
const STORAGE_KEY = "user";

// A helper function that reads the saved user from localStorage.
// localStorage is a small storage area in the browser.
// It keeps data even after the page is refreshed or the browser is closed,
// so the user stays logged in after a refresh.
function getStoredUser() {
  // try/catch: run the code in "try". If something crashes,
  // jump to "catch" instead of crashing the whole app.
  try {
    // localStorage can only store TEXT (strings).
    // getItem gets the text saved under our key, or null if nothing is saved.
    const raw = localStorage.getItem(STORAGE_KEY);

    // If text exists, JSON.parse converts it back into a real JavaScript object,
    // e.g. '{"name":"Ravi"}'  ->  { name: "Ravi" }
    // If nothing is saved, return null, which means "nobody is logged in".
    return raw ? JSON.parse(raw) : null;
  } catch {
    // We land here if the saved text is broken (bad JSON) or the browser blocks
    // storage. We treat that as "nobody is logged in" instead of crashing.
    return null;
  }
}

// STEP 2: The Provider component. It holds the login data and shares it.
// In main.jsx we wrap <App /> with it, so every component can use the data.
//
// { children } is a prop. It means "everything placed between
// <AuthProvider> and </AuthProvider>". In our app, that is <App />.
export function AuthProvider({ children }) {
  // useState creates a piece of data that React remembers between renders.
  // When it changes, React re-draws every component that uses it.
  //   user    -> the current value (an object like { name, email }, or null)
  //   setUser -> the function used to change it
  //
  // We pass getStoredUser (WITHOUT brackets) so React calls it only ONCE,
  // when the app first loads, to get the starting value.
  // If we wrote getStoredUser() with brackets, it would run on every render.
  const [user, setUser] = useState(getStoredUser);

  // useEffect runs code AFTER the component appears on the screen.
  // Here, we use it to listen for changes made in OTHER browser tabs.
  useEffect(() => {
    // This function runs whenever localStorage is changed by another tab.
    // "e" is the event object, and e.key is the name of the item that changed.
    const onStorage = (e) => {
      // Only react if the changed item is our "user" item.
      // Then re-read localStorage and update our state.
      // Example: you log out in Tab A, and Tab B updates and logs out too.
      if (e.key === STORAGE_KEY) setUser(getStoredUser());
    };

    // Tell the browser: "when the 'storage' event happens, call onStorage".
    // Note: this event fires only in the OTHER tabs, not the tab that made the change.
    window.addEventListener("storage", onStorage);

    // The function returned here is the "cleanup".
    // React runs it when the component is removed from the page.
    // We remove the listener so it doesn't stay in memory doing nothing.
    return () => window.removeEventListener("storage", onStorage);
  }, []); // [] = run this effect only ONCE, when the component first loads.

  // The login function. It is called after the user logs in successfully.
  // userData is an object such as { name: "Ravi", email: "ravi@mail.com" }.
  //
  // useCallback remembers the function, so React does not create a brand-new
  // copy on every render. This is a performance improvement.
  const login = useCallback((userData) => {
    try {
      // Save the user in localStorage so they stay logged in after a refresh.
      // JSON.stringify converts the object into text, because localStorage
      // can only store text.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // If saving fails (private mode, storage full), do nothing here.
      // The user is still logged in for this session because of setUser below.
    }
    // Update the state. React re-draws the app, and isAuthenticated becomes true.
    setUser(userData);
  }, []); // [] = this function never needs to change, so create it once.

  // The logout function. It clears the user everywhere.
  const logout = useCallback(() => {
    try {
      // Delete the saved user from localStorage.
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    // Set the user back to null. React re-draws, and isAuthenticated becomes false.
    setUser(null);
  }, []);

  // Build the object we will put inside the shared box.
  // useMemo remembers this object and creates a new one only when something in
  // the list at the bottom [user, login, logout] changes.
  // Without it, a new object would be created on every render, and every
  // component using the context would re-draw for no reason.
  const value = useMemo(
    () => ({
      user, // the user object, or null
      login, // function to log in
      logout, // function to log out

      // !!user turns any value into true or false:
      //   user is an object -> !!user is true  (logged in)
      //   user is null      -> !!user is false (not logged in)
      // The first ! turns it into the opposite boolean, the second ! flips it back.
      isAuthenticated: !!user,
    }),
    [user, login, logout]
  );

  // Put "value" into the shared box and share it with everything inside.
  // {children} is the rest of the app (<App />). Every component inside
  // can now read "value" using the useAuth hook below.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// STEP 3: Our own custom hook, a shortcut to open the box.
// Components just write:  const { user, login, logout, isAuthenticated } = useAuth();
export function useAuth() {
  // useContext opens the shared box and gives us what is inside it.
  const context = useContext(AuthContext);

  // If the value is still null, the component is NOT inside <AuthProvider>.
  // That is a mistake in our setup, so we throw a clear error message
  // instead of a confusing one like "cannot read property of null".
  if (context === null) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }

  // Everything is fine, so return the box contents:
  // { user, login, logout, isAuthenticated }
  return context;
}