import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter, setAxiosInstance } from "@workspace/api-client-react";
import api from "./lib/api";

setAuthTokenGetter(() => localStorage.getItem("accessToken"));
setAxiosInstance(api);

createRoot(document.getElementById("root")!).render(<App />);
