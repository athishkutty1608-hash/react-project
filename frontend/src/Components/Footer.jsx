// src/components/Footer.jsx

// Link is like a normal <a> tag, but it changes the page without reloading.
// useLocation tells us which page (URL) the app is on right now.
import { Link, useLocation } from "react-router-dom";

// A list of exact pages where the footer must be hidden.
// Write every path in lowercase, because we lowercase the URL before comparing.
// Defined outside the component so it isn't recreated on every render.
const HIDE_ON_PAGES = ["/login", "/register", "/dashboard"];

// A list of page "sections". The footer is hidden on the section itself
// and on everything under it, e.g. /admin, /admin/users, /admin/settings.
const HIDE_ON_SECTIONS = ["/admin"];

// The links shown in the "Pages" column of the footer.
const links = [
  { to: "/", label: "Home" },
  { to: "/About", label: "About" },
  { to: "/Contact", label: "Contact" },
];

function Footer() {
  // RULE: hooks must always be called at the top of the component,
  // before any "if" or "return".

  // useLocation() returns an object that describes the current URL, like:
  // { pathname: "/About", search: "", hash: "", ... }
  // { pathname } is "destructuring": we pick only the pathname out of that object.
  const { pathname } = useLocation();

  // Make the path lowercase once, so "/Login" and "/login" are treated the same.
  const path = pathname.toLowerCase();

  // CHECK 1: is the current page in our list of hidden pages?
  const isHiddenPage = HIDE_ON_PAGES.includes(path);

  // CHECK 2: does the current path start with a hidden section?
  // .some() returns true if at least one item matches.
  // .startsWith() checks the beginning of the text ("/admin/users" starts with "/admin").
  const isHiddenSection = HIDE_ON_SECTIONS.some((section) =>
    path.startsWith(section)
  );

  // If ANY check is true, draw nothing. || means "or".
  // "return null" tells React to render nothing, so the footer disappears.
  if (isHiddenPage || isHiddenSection) return null;

  // Otherwise the footer is drawn.
  return (
    // w-full -> full width
    // bg-gradient-to-br from-gray-900 to-red-950 -> dark background fading toward dark red
    // text-gray-300 -> light gray text (readable on a dark background)
    <footer className="w-full bg-gradient-to-br from-gray-900 to-red-950 text-gray-300">
      {/* Three columns on medium screens and up (md:grid-cols-3), one column on phones.
          gap-10 -> space between the columns. */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
        {/* Column 1: logo and a short line about the company. */}
        <div>
          {/* The logo sits on a white tile so it stays readable on the dark background. */}
          <div className="inline-block rounded-xl bg-white p-2">
            <img
              src="https://t4.ftcdn.net/jpg/00/24/48/79/240_F_24487944_nxBNrSS0tJjzuCOF4gaULZ3xdR0ef5tJ.jpg"
              alt="Check the internet" // shown if the image fails to load
              className="w-[100px]"
            />
          </div>
          <p className="mt-4 max-w-xs leading-relaxed">
            Websites, apps and cloud systems for growing businesses.
          </p>
        </div>

        {/* Column 2: links to the main pages. */}
        <nav aria-label="Footer">
          <h2 className="text-white font-semibold">Pages</h2>
          <ul className="mt-4 space-y-2">
            {/* Loop through the list and make one link per item. */}
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white transition">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Column 3: a short message and a button to the login page. */}
        <div>
          <h2 className="text-white font-semibold">Get started</h2>
          <p className="mt-4 leading-relaxed">Create a free account and sign in from any device.</p>
          <Link
            to="/login"
            className="mt-4 inline-block px-5 py-2 rounded-full bg-white text-red-600 font-semibold hover:-translate-y-0.5 transition"
          >
            Login or register
          </Link>
        </div>
      </div>

      {/* The bottom strip with the copyright text. */}
      <div className="border-t border-white/10">
        <p className="max-w-6xl mx-auto px-6 py-5 text-sm text-gray-400">
          {/* new Date().getFullYear() gives the current year, so it never goes out of date.
              &copy; is the HTML code for the © symbol. */}
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Export the component so other files (like App.jsx) can import and use it.
export default Footer;