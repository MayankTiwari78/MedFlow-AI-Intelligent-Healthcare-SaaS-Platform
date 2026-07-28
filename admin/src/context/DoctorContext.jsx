"use client";

import axios from "axios";
import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { configureAdminAuth, isAuthSessionHandledError } from "../api/authClient";
import { publicEnv } from "../lib/env";

export const DoctorContext = createContext();

const DoctorContextProvider = ({ children }) => {
  const backendUrl = publicEnv.backendUrl;
  const [dToken, setDToken] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [dashboardState, setDashboardState] = useState("idle");
  const [dashboardError, setDashboardError] = useState("");
  const [profileData, setProfileData] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDToken(window.localStorage.getItem("dToken") || "");
    }
    configureAdminAuth({ backendUrl, setDToken });
  }, [backendUrl]);

  const getAppointments = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, { headers: { dToken } });
      if (data.success) setAppointments(data.appointments.reverse());
      else toast.error(data.message);
    } catch (error) {
      if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || "Unable to load appointments");
    }
  }, [backendUrl, dToken]);

  const getProfileData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, { headers: { dToken } });
      setProfileData(data.profileData);
    } catch (error) {
      if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || "Unable to load profile");
    }
  }, [backendUrl, dToken]);

  const getDashData = useCallback(async () => {
    if (!dToken) return;
    setDashboardState("loading");
    setDashboardError("");
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, { headers: { dToken } });
      if (data.success) { setDashData(data.dashData); setDashboardState("ready"); }
      else { setDashData(false); setDashboardError(data.message || "The dashboard is unavailable."); setDashboardState("error"); }
    } catch (error) {
      setDashData(false);
      setDashboardError(error.response?.data?.message || "We could not load the dashboard. Check the service and retry.");
      setDashboardState("error");
      if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || "Unable to load dashboard");
    }
  }, [backendUrl, dToken]);

  const updateAppointment = useCallback(
    async (endpoint, appointmentId, successMessage) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}${endpoint}`,
          { appointmentId },
          { headers: { dToken } }
        );
        if (data.success) {
          toast.success(data.message || successMessage);
          await Promise.all([getAppointments(), getDashData()]);
        } else toast.error(data.message);
      } catch (error) {
        if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || successMessage);
      }
    },
    [backendUrl, dToken, getAppointments, getDashData]
  );

  const cancelAppointment = useCallback(
    (appointmentId) => updateAppointment("/api/doctor/cancel-appointment", appointmentId, "Unable to cancel appointment"),
    [updateAppointment]
  );
  const runOperationalAppointmentAction = useCallback(
    async ({ endpoint, payload }) => {
      try {
        const { data } = await axios.post(`${backendUrl}${endpoint}`, payload, { headers: { dToken } });
        if (data.success) {
          toast.success(data.message || "Appointment updated");
          await Promise.all([getAppointments(), getDashData()]);
        } else toast.error(data.message);
      } catch (error) {
        if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || "Unable to update appointment");
      }
    },
    [backendUrl, dToken, getAppointments, getDashData]
  );
  const updateClinicalNotes = useCallback(
    async (appointmentId, clinicalNotes) => {
      try {
        const { data } = await axios.patch(
          `${backendUrl}/api/doctor/appointments/${appointmentId}/clinical-notes`,
          { clinicalNotes },
          { headers: { dToken } }
        );
        if (data.success) {
          toast.success("Clinical notes saved");
          await getAppointments();
        } else toast.error(data.message);
      } catch (error) {
        if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || error.message || "Unable to save clinical notes");
      }
    },
    [backendUrl, dToken, getAppointments]
  );

  return (
    <DoctorContext.Provider
      value={{
        dToken,
        setDToken,
        backendUrl,
        appointments,
        getAppointments,
        cancelAppointment,
        runOperationalAppointmentAction,
        updateClinicalNotes,
        dashData,
        dashboardState,
        dashboardError,
        getDashData,
        profileData,
        setProfileData,
        getProfileData
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
