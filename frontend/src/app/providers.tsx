"use client";

import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import AppContextProvider from "../context/AppContext";

export const Providers = ({ children }: { children: ReactNode }) => (
  <AppContextProvider>
    <ToastContainer />
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="mf-page min-h-[calc(100vh-22rem)] py-8 sm:py-10">{children}</div>
      <Footer />
    </div>
  </AppContextProvider>
);
