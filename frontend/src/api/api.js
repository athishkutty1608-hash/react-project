// ============================================================
// BIG PICTURE (read this first)
// ============================================================
// This file is the "bridge" between our React frontend and the FastAPI backend.
// Components never write URLs or request code themselves. They just call
// functions from this file, like loginUser(...).
//
// It does 3 things:
//   1. Creates one axios "connection" with the settings shared by all requests
//   2. Cleans up error messages coming back from FastAPI
//   3. Exports one small function for each backend endpoint
// ============================================================

// Import axios, a library for sending HTTP requests to a server.
// Install it once with:  npm install axios
import axios from "axios";

// STEP 1: Create ONE axios instance (a pre-configured copy of axios).
// Every request below uses it, so we write the settings only once.
const API = axios.create({
  // baseURL is added in front of every path.
  // Example: API.post("/auth/login") really calls http://localhost:8000/auth/login
  //
  // import.meta.env.VITE_API_URL reads a value from the .env file.
  // Vite only exposes variables whose names start with VITE_.
  //
  // || means "or". If VITE_API_URL is missing, use "http://localhost:8000".
  // This lets us change the server address later (for example, when we deploy)
  // without editing the code.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",

  // Tell the browser to send and receive cookies with every request.
  // We need this because the login token is stored in an httpOnly cookie,
  // and without this line the browser would not send that cookie to the server.
  withCredentials: true,
});

// STEP 2: Interceptor = a checkpoint that every reply passes through
// BEFORE our components see it.
// .use() takes two functions:
//   1st function -> runs when the request succeeds
//   2nd function -> runs when the request fails
API.interceptors.response.use(
  // SUCCESS: the server replied with a good status (200, 201, ...).
  // We simply pass the reply through unchanged.
  (response) => response,

  // FAILURE: something went wrong. "error" holds the details.
  (error) => {
    // error.response is the server's reply. If it does NOT exist, the server
    // never answered: it is turned off, the URL is wrong, or CORS is blocking us.
    if (!error.response) {
      // Promise.reject makes the request fail, and whoever called it
      // (for example the catch block in Login.jsx) receives this new Error.
      return Promise.reject(
        new Error("Cannot reach the server. Is the backend running?")
      );
    }

    // If we reach here, the server DID reply, but with an error status
    // (400, 401, 422, 500, ...). FastAPI puts the message inside "detail".
    //
    // The ?. is "optional chaining": if data is missing, it gives undefined
    // instead of crashing the app.
    //
    // FastAPI sends errors in two shapes:
    //   normal error:     { detail: "Incorrect password" }
    //   validation error: { detail: [ { msg: "field required" } ] }   (status 422)
    const detail = error.response.data?.detail;

    // Pick the message depending on the shape (a chained ternary):
    //   condition ? valueIfTrue : valueIfFalse
    const message =
      typeof detail === "string" // Is detail plain text?
        ? detail // yes -> use it directly
        : Array.isArray(detail) // Is detail a list?
        ? detail[0]?.msg // yes -> use the message of the first item
        : "Something went wrong"; // neither -> use a general message

    // Fail with a simple Error that has a readable message.
    // In our components we can now write:  setError(err.message)
    return Promise.reject(new Error(message));
  }
);

// STEP 3: One function per backend endpoint.
// "export" lets other files import them, like:
//   import { loginUser } from "../api/api";
//
// The arrow function (data) => API.post(...) means:
// "take data, send it to that path with a POST request".

// POST = send new data to the server.
// Creates a new account. "data" is like { name, email, password }.
export const registerUser = (data) => API.post("/auth/register", data);

// Logs in. "credentials" is like { email, password }.
// The server checks them and sets the login cookie.
export const loginUser = (credentials) => API.post("/auth/login", credentials);

// Logs out. No data is needed, so nothing is sent.
// The server clears the login cookie.
export const logoutUser = () => API.post("/auth/logout");

// GET = ask the server for data.
// Asks "who is logged in right now?". The browser sends the cookie automatically
// (because of withCredentials), and the server replies with the user's details.
export const getCurrentUser = () => API.get("/auth/me");


{/*The contract both backends must follow

Your api.js and Login.jsx expect this:

Endpoint	                   Body	                     Success reply	                 Error reply
POST /auth/register	    {name, email, password}	    {"user": {"name", "email"}}	    {"detail": "message"}
POST /auth/login	    {email, password}	        {"user": {...}} 	            {"detail": "message"}
                                                      plus an httpOnly cookie
POST /auth/logout	        none	                        any                              JSON	
GET /auth/me	            none (cookie)	            {"user": {...}}                      401 

*/}