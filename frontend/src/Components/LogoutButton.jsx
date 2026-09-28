// src/Components/LogoutButton.jsx

// useNavigate is a hook from React Router.
// It gives us a function that can move the user to another page using code
// (without the user clicking a link).
import { useNavigate } from "react-router-dom";

// Our own hook from AuthContext.
// It gives us the login information and the login/logout functions.
import { useAuth } from "../context/AuthContext";

// The default look of the button, used when the parent sends no className.
// (A red gradient pill with a soft shadow that lifts a little on hover.)
const defaultClass =
  "px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-red-600 to-rose-500 shadow-md shadow-red-600/30 hover:shadow-lg hover:-translate-y-0.5 transition";

// "export default" lets other files import this component (Navbar.jsx does).
//
// The { className = defaultClass, children = "Logout" } part receives PROPS.
// Props are values the parent component passes in, like arguments to a function.
//   className -> styling classes sent from the parent
//   children  -> whatever is written between <LogoutButton> and </LogoutButton>
// The "= ..." part sets a default value, used when the parent sends nothing.
export default function LogoutButton({ className = defaultClass, children = "Logout" }) {
  // From useAuth, take out two things:
  //   logout          -> a function that clears the user and their saved login
  //   isAuthenticated -> true if a user is logged in, false if not
  const { logout, isAuthenticated } = useAuth();

  // Call useNavigate to get the "navigate" function.
  // Hooks must be called at the top, before any "if" or "return".
  const navigate = useNavigate();

  // If nobody is logged in, there is nothing to log out from.
  // "return null" tells React to draw nothing, so the button is hidden.
  if (!isAuthenticated) return null;

  // This function runs when the button is clicked.
  const handleLogout = () => {
    // Step 1: log the user out (clears the user state and localStorage).
    logout();

    // Step 2: send the user to the login page.
    // { replace: true } replaces the current page in the browser history,
    // so pressing the Back button will not return to the page they just left.
    navigate("/login", { replace: true });
  };

  // What appears on the screen: a normal HTML button.
  return (
    // type="button" -> a plain button (it will not submit a form if placed inside one).
    // onClick       -> run handleLogout when clicked. We write handleLogout, not
    //                  handleLogout(), because we pass the function itself to run later.
    // className     -> the styling (from the parent, or the default above).
    <button type="button" onClick={handleLogout} className={className}>
      {/* {children} shows the text between the tags, or the default word "Logout". */}
      {children}
    </button>
  );
}