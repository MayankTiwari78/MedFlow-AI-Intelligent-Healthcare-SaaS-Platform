"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { configurePatientAuth } from "../api/authClient";
import { publicEnv } from "../lib/env";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const backendUrl = publicEnv.backendUrl;
  const currencySymbol = "INR ";
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState(false);
  const initialDoctorLoadStarted = useRef(false);

  const getDoctosData = useCallback(async () => {
    setDoctorsLoading(true);
    setDoctorsError("");
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
      if (data.success) {
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      } else {
        setDoctors([]);
        setDoctorsError("The clinician directory is temporarily unavailable. Please try again shortly.");
      }
    } catch (error) {
      setDoctors([]);
      setDoctorsError(
        error.response
          ? "The clinician directory is temporarily unavailable. Please try again shortly."
          : "We could not reach the clinician directory. Check the local service and try again."
      );
    } finally {
      setDoctorsLoading(false);
    }
  }, [backendUrl]);

  const loadUserProfileData = useCallback(async () => {
    if (!token) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, { headers: { token } });
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to load your profile");
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(window.localStorage.getItem("token") || "");
    }
    configurePatientAuth({ backendUrl, setToken });
  }, [backendUrl]);

  useEffect(() => {
    if (initialDoctorLoadStarted.current) return;
    initialDoctorLoadStarted.current = true;
    void getDoctosData();
  }, [getDoctosData]);

  useEffect(() => {
    void loadUserProfileData();
  }, [loadUserProfileData]);

  const value = {
    doctors,
    doctorsLoading,
    doctorsError,
    getDoctosData,
    currencySymbol,
    backendUrl,
    token,
    setToken,
    userData,
    setUserData,
    loadUserProfileData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
