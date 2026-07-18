import React, { useState } from 'react'
import { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, updateClinicalNotes } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [noteDrafts, setNoteDrafts] = useState({})

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <main className='portal-page'>

      <div><p className='portal-eyebrow'>Clinical schedule</p><h1 className='portal-title'>Appointments</h1><p className='mt-2 text-slate-600'>Review patient bookings and record appointment outcomes.</p></div>

      <div className='portal-card text-sm max-h-[75vh] overflow-y-auto'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b border-line bg-mist font-semibold text-slate-600'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <div className='border-b border-line hover:bg-mist' key={item._id || index}>
            <div className='flex flex-wrap justify-between max-sm:gap-5 sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-slate-600 py-3 px-6'>
              <p className='max-sm:hidden'>{index}</p>
              <div className='flex items-center gap-2'>
                <img src={item.userData.image} className='w-8 rounded-full bg-mist' alt={item.userData.name} /> <p>{item.userData.name}</p>
              </div>
              <div>
                <p className='portal-status bg-[#E7F4F5] text-primary'>
                  {item.payment?'Online':'CASH'}
                </p>
              </div>
              <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>
              {item.cancelled
                ? <p className='portal-status bg-red-50 text-red-700'>Cancelled</p>
                : item.isCompleted
                  ? <p className='portal-status bg-emerald-50 text-emerald-700'>Completed</p>
                  : <div className='flex'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
              }
            </div>
            <div className='grid gap-3 px-6 pb-4 sm:grid-cols-[1fr_auto] sm:items-end'>
              <label className='portal-label'>Clinical notes<textarea className='portal-field mt-1 min-h-20 resize-y' value={noteDrafts[item._id] ?? item.clinicalNotes ?? ''} onChange={(event) => setNoteDrafts((current) => ({ ...current, [item._id]: event.target.value }))} maxLength={5000} /></label>
              <button type='button' className='portal-button-secondary' onClick={() => updateClinicalNotes(item._id, noteDrafts[item._id] ?? item.clinicalNotes ?? '')}>Save notes</button>
            </div>
          </div>
        ))}
      </div>

        {appointments.length === 0 && <p className='p-10 text-center text-slate-500'>No appointments are currently assigned.</p>}
    </main>
  )
}

export default DoctorAppointments
