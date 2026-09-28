// src/components/ScrollToTop.jsx

// useEffect lets a component run code at a certain moment
// (here: every time the page URL changes).
import { useEffect } from "react";

// useLocation tells us which page (URL) the app is on right now.
import { useLocation } from "react-router-dom";

// This component draws nothing on the screen.
// Its only job is to scroll the page to the top when the user opens a new page.
// Put it inside <BrowserRouter> in App.jsx.
function ScrollToTop() {
  // pathname -> the page path, for example "/About"
  // hash     -> the part after #, for example "#services" (empty if there is none)
  const { pathname, hash } = useLocation();

  // This code runs every time pathname or hash changes (see the list at the end).
  useEffect(() => {
    // If the link has a #section, scroll to that section instead of the top.
    if (hash) {
      // hash.slice(1) removes the "#", so "#services" becomes "services".
      // getElementById finds the element on the page with that id.
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView(); // scroll so that element is visible
        return; // stop here, do not scroll to the top
      }
    }

    // No #section: jump to the very top of the page (0 pixels from left and top).
    // behavior: "instant" means no slow scrolling animation.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  // "return null" tells React to draw nothing.
  return null;
}

// Export the component so App.jsx can import and use it.
export default ScrollToTop;