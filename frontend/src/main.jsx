import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
// We will uncomment the store and app imports later in the frontend build phase
// import { store } from "./store/index.js";
// import App from "./App.jsx";
import "./index.css";

// Temporary placeholder until Phase 7
const PlaceholderApp = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <h1 className="text-3xl text-text-primary font-bold">AttendX v2 Frontend Scaffolded</h1>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <Provider store={store}> */}
      {/* <App /> */}
      <PlaceholderApp />
    {/* </Provider> */}
  </React.StrictMode>
);
