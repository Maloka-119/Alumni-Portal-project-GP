import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // تغيير من HashRouter إلى BrowserRouter
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./i18n/i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* تغيير من HashRouter إلى BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
