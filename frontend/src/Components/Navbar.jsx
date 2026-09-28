// src/components/Navbar.jsx

// useState lets a component REMEMBER a value between renders.
// useEffect lets a component run code at a certain moment (for example, when it first appears).
import { useEffect, useState } from "react";

// NavLink is a special link from React Router.
// It changes the page without reloading the whole website,
// and it knows when it points to the page you are on (the "active" link).
import { NavLink } from "react-router-dom";

// Our own hook from AuthContext.
// It tells us whether a user is logged in or not.
import { useAuth } from "../context/AuthContext";

// The Logout button component we created in its own file.
import LogoutButton from "./LogoutButton";

// The list of menu links, written once and reused for desktop and mobile.
// "to" is the URL, "label" is the text the user sees.
// Defined outside the component so it is not recreated on every render.
const links = [
  { to: "/", label: "Home" },
  { to: "/About", label: "About" },
  { to: "/Contact", label: "Contact" },
];

// Style for the red gradient button (Login / Logout), written once and reused.
// px-5 py-2        -> space inside the button (left-right 5, top-bottom 2)
// rounded-full     -> fully round ends (a pill shape)
// text-white       -> white text
// font-semibold    -> slightly bold text
// bg-gradient-to-r from-red-600 to-rose-500 -> color fades from red to rose, left to right
// shadow-md shadow-red-600/30 -> a soft red shadow (30% strength)
// hover:...        -> styles that apply only while the mouse is over the button
// transition       -> makes the hover change smooth instead of instant
const pill =
  "px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-red-600 to-rose-500 shadow-md shadow-red-600/30 hover:shadow-lg hover:-translate-y-0.5 transition";

// A component is a function that returns what should appear on the screen.
// Component names always start with a capital letter.
function Navbar() {
  // RULE: hooks must always be called at the top of the component,
  // before any "if" or "return".

  // Take out only "isAuthenticated" from useAuth.
  // It is true when a user is logged in, false when not.
  const { isAuthenticated } = useAuth();

  // open     -> true when the mobile menu is open, false when it is closed.
  // setOpen  -> the function we call to change "open".
  // useState(false) means the menu starts closed.
  const [open, setOpen] = useState(false);

  // scrolled -> true once the user has scrolled down the page a little.
  // We use it to show a shadow under the navbar.
  const [scrolled, setScrolled] = useState(false);

  // useEffect runs this code after the navbar appears on the screen.
  // The empty list [] at the end means "run only once".
  useEffect(() => {
    // window.scrollY is how many pixels the page has been scrolled down.
    // If it is more than 8, we set scrolled to true.
    const onScroll = () => setScrolled(window.scrollY > 8);

    // Run once now, in case the page is already scrolled when it loads.
    onScroll();

    // Tell the browser: call onScroll every time the user scrolls.
    // passive: true tells the browser we will not block scrolling (smoother).
    window.addEventListener("scroll", onScroll, { passive: true });

    // The function we return is a "cleanup". React runs it when the navbar is
    // removed, so the scroll listener does not keep running for nothing.
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // NavLink gives us { isActive }, which is true for the page we are on.
  // We use it to give the current page's link a light red background.
  // Backticks `...` let us mix plain text with ${ ... } JavaScript values.
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-full font-medium transition ${
      isActive
        ? "bg-red-50 text-red-600" // active page: light red background, red text
        : "text-gray-700 hover:text-red-600 hover:bg-gray-100" // other pages
    }`;

  // Whatever we return here is what React shows on the page.
  return (
    // <header> is the HTML tag for the top part of a website.
    // Tailwind classes:
    // fixed            -> the bar stays stuck to the screen, even when you scroll
    // top-0 inset-x-0  -> stick it to the top, from the left edge to the right edge
    // z-50             -> stack it above the rest of the page
    // h-16             -> height of 4rem (64px)
    // bg-white/80      -> white background, 80% solid (a little see-through)
    // backdrop-blur-md -> blur whatever is behind the bar (frosted glass look)
    // border-b         -> a border on the bottom edge
    <header
      className={`fixed top-0 inset-x-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b transition-shadow ${
        scrolled
          ? "border-gray-200 shadow-md shadow-gray-900/5" // scrolled: visible border + shadow
          : "border-transparent" // at the top: no visible border
      }`}
    >
      {/* This inner box keeps the content centered and not too wide.
          max-w-6xl  -> never wider than 72rem
          mx-auto    -> center it left-to-right
          h-full     -> as tall as the header
          flex items-center justify-between -> put items in a row, centered
                       vertically, with the free space between them */}
      <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
        {/* The company logo, wrapped in a link to the home page.
            aria-label describes the link for screen readers (there is no text in it).
            onClick closes the mobile menu after the logo is clicked. */}
        <NavLink to="/" onClick={() => setOpen(false)} aria-label="Go to home page">
          {/* src = where the image is loaded from.
              alt = text shown if the image fails to load (also used by screen readers). */}
          <img
            src="https://t4.ftcdn.net/jpg/00/24/48/79/240_F_24487944_nxBNrSS0tJjzuCOF4gaULZ3xdR0ef5tJ.jpg"
            alt="Check the internet"
            className="w-[100px]"
          />
        </NavLink>

        {/* <nav> is the HTML tag that holds the main navigation links.
            hidden md:flex -> hidden on phones, shown as a row on medium screens and up. */}
        <nav className="hidden md:flex items-center gap-2" aria-label="Main">
          {/* .map() loops through the list and makes one NavLink for each item.
              key helps React track each item in a list (it must be unique).
              end (only for "/") stops Home from looking active on every page,
              because every URL starts with "/". */}
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Login / Logout button for big screens (hidden on phones).
            Conditional rendering syntax:  condition ? (if true) : (if false)
            - Logged in     -> show the Logout button.
            - Not logged in -> show the Login link. */}
        <div className="hidden md:block">
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <NavLink to="/login" className={pill}>Login</NavLink>
          )}
        </div>

        {/* The menu button ("hamburger") that only appears on phones (md:hidden).
            onClick flips "open": true becomes false, false becomes true.
            aria-label / aria-expanded tell screen readers what the button does. */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-100"
        >
          {/* An SVG is a small drawing made from code. "d" is the path of the lines.
              When the menu is open we draw an X, otherwise three lines. */}
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </div>

      {/* The mobile dropdown menu.
          (condition && something) shows "something" only if the condition is true,
          so this menu exists only while "open" is true. */}
      {open && (
        <nav aria-label="Mobile" className="md:hidden bg-white border-b border-gray-200 shadow-xl px-6 py-4 flex flex-col gap-1">
          {/* Same links as the desktop menu. Clicking one also closes the menu. */}
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          {/* Login / Logout for phones. Clicking anywhere in this box closes the menu. */}
          <div className="mt-3" onClick={() => setOpen(false)}>
            {isAuthenticated ? (
              <LogoutButton className={`w-full ${pill}`} />
            ) : (
              <NavLink to="/login" className={`block text-center ${pill}`}>Login</NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

// Export the component so other files (like App.jsx) can import and use it.
export default Navbar;