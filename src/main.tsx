import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ✅ Fix: add -dom here
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);

// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router";
// import App from "./App.tsx";
// import "./index.css";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const queryClient = new QueryClient()

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <BrowserRouter>
//   <QueryClientProvider client={queryClient}>
//     <App />
//   </QueryClientProvider>
//   </BrowserRouter>
// );
