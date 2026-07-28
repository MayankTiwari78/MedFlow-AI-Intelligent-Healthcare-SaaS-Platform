import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from '../lib/routerCompat'
import { publicEnv } from '../lib/env'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { isAuthSessionHandledError } from '../api/authClient'
import { useProtectedPatientRoute } from '../hooks/useProtectedPatientRoute'
import { imageSrc } from '../lib/imageSrc'

const appointmentStatus = (appointment) => {
    if (appointment.cancelled || appointment.status === 'cancelled') return 'cancelled'
    if (appointment.status === 'no_show') return 'no_show'
    if (appointment.status === 'completed' || appointment.isCompleted) return 'completed'
    return appointment.status || 'scheduled'
}

const statusClass = (status) => ({
    scheduled: 'bg-[#E7F4F5] text-primary',
    checked_in: 'bg-sky-50 text-sky-700',
    in_consultation: 'bg-violet-50 text-violet-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-700',
    no_show: 'bg-slate-100 text-slate-700'
}[status] || 'bg-slate-100 text-slate-700')

const MyAppointments = () => {

    const { authStatus, backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()
    useProtectedPatientRoute({ authStatus, token })

    const [appointments, setAppointments] = useState([])
    const [payment, setPayment] = useState('')
    const [queue, setQueue] = useState({})

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) {
            const date = new Date(`${slotDate}T12:00:00`)
            return Number.isNaN(date.getTime()) ? slotDate : `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
        }
        const dateArray = slotDate.split('_')
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
    }

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
            setAppointments(data.appointments.reverse())

        } catch (error) {
            if (!isAuthSessionHandledError(error)) toast.error(error.message)
        }
    }

    // Function to cancel appointment Using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }   

        } catch (error) {
            if (!isAuthSessionHandledError(error)) toast.error(error.message)
        }

    }

    const initPay = (order) => {
        const options = {
            key: publicEnv.razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: 'Appointment Payment',
            description: "Appointment Payment",
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {

                try {
                    const { data } = await axios.post(backendUrl + "/api/user/verifyRazorpay", response, { headers: { token } });
                    if (data.success) {
                        navigate('/my-appointments')
                        getUserAppointments()
                    }
                } catch (error) {
                    if (!isAuthSessionHandledError(error)) toast.error(error.message)
                }
            }
        };
        if (typeof window === 'undefined' || !window.Razorpay) {
            toast.error('The payment service is unavailable. Please try again.')
            return
        }
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    // Function to make payment using razorpay
    const appointmentRazorpay = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', { appointmentId }, { headers: { token } })
            if (data.success) {
                initPay(data.order)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            if (!isAuthSessionHandledError(error)) toast.error(error.message)
        }
    }

    // Function to make payment using stripe
    const appointmentStripe = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', { appointmentId }, { headers: { token } })
            if (data.success) {
                const { session_url } = data
                window.location.replace(session_url)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            if (!isAuthSessionHandledError(error)) toast.error(error.message)
        }
    }



    useEffect(() => {
        if (token) {
            getUserAppointments()
        }
    }, [token])

    if (authStatus === 'initializing') {
        return <div className='py-12'><div className='mf-card h-80 animate-pulse bg-[#EAF3F4]' /></div>
    }

    const loadQueue = async (appointmentId) => {
        try { const { data } = await axios.get(`${backendUrl}/api/user/appointments/${appointmentId}/queue`, { headers: { token } }); setQueue((current) => ({ ...current, [appointmentId]: data.queue })) }
        catch (error) { if (!isAuthSessionHandledError(error)) toast.error(error.response?.data?.message || 'Unable to load queue status') }
    }

    if (!token) {
        return <div className='py-12'><div className='mf-card h-80 animate-pulse bg-[#EAF3F4]' /></div>
    }

    return (
        <section>
            <div className='mf-tech-grid relative overflow-hidden rounded-2xl bg-[#082133] px-6 py-6 text-white sm:px-8'><div className='absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#1BAEAC]/25 blur-3xl' /><div className='relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end'><div><p className='text-xs font-bold uppercase tracking-[.16em] text-[#70E7DC]'>Your connected care workspace</p><h1 className='mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl'>My appointments</h1><p className='mt-3 max-w-2xl text-sm leading-6 text-slate-200'>See what is next, follow progress from booking to care, and return to each appointment when you need to take action.</p></div><div className='rounded-xl border border-white/15 bg-white/[.07] px-4 py-3 text-sm'><p className='text-slate-300'>Care items</p><p className='mt-1 text-xl font-semibold text-[#83EEE4]'>{appointments.length}</p></div></div></div>
            <div className='relative mt-6 space-y-4 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-[#BFE4E5] sm:before:left-7'>
                {appointments.map((item, index) => (
                    <article key={item._id || index} className='mf-card relative grid gap-4 p-4 sm:grid-cols-[112px_1fr] sm:p-5 lg:grid-cols-[112px_1fr_auto]'><span className='absolute -left-0 top-7 z-10 hidden h-3 w-3 rounded-full border-[3px] border-[#F3F8FA] bg-[#0B9A9A] sm:block' aria-hidden='true' />
                        <div>
                            <img className='aspect-square w-full rounded-lg bg-[#E7F4F5] object-cover object-top sm:h-[112px] sm:w-[112px]' src={imageSrc(item.docData?.image, assets.profile_pic)} alt={item.docData?.name || 'Clinician profile'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.profile_pic }} />
                        </div>
                        <div className='min-w-0 text-sm text-slate-600'>
                            <div className='flex flex-wrap items-start justify-between gap-3'><div><p className='text-lg font-semibold text-ink'>{item.docData?.name || 'Clinician details'}</p><p className='mt-1 font-medium text-primary'>{item.docData?.speciality || 'Speciality available in profile'}</p></div><span className={`mf-status ${statusClass(appointmentStatus(item))}`}>{appointmentStatus(item).replace('_', ' ')}</span></div>
                            <div className='mt-4 grid gap-2 leading-6 sm:grid-cols-2'><p><span className='font-semibold text-ink'>Date & time</span><br />{slotDateFormat(item.slotDate)} · {item.slotTime}</p><p><span className='font-semibold text-ink'>Location</span><br />{item.docData?.address?.line1 || 'Available in clinician profile'}{item.docData?.address?.line2 ? `, ${item.docData.address.line2}` : ''}</p></div>
                            <div className='mt-5 grid grid-cols-3 gap-1 overflow-hidden rounded-lg bg-[#EAF4F5] p-1 text-[10px] font-bold uppercase tracking-[.08em] text-slate-400'><span className={`rounded-md px-2 py-2 text-center ${['scheduled', 'checked_in', 'in_consultation', 'completed'].includes(appointmentStatus(item)) ? 'bg-white text-[#087F91] shadow-sm' : ''}`}>Booked</span><span className={`rounded-md px-2 py-2 text-center ${['checked_in', 'in_consultation', 'completed'].includes(appointmentStatus(item)) ? 'bg-white text-[#087F91] shadow-sm' : ''}`}>Check-in</span><span className={`rounded-md px-2 py-2 text-center ${['in_consultation', 'completed'].includes(appointmentStatus(item)) ? 'bg-white text-[#087F91] shadow-sm' : ''}`}>Care</span></div>
                            {item.queueToken && <div className='mt-3 rounded-md bg-mist p-3 text-xs'><p className='font-semibold text-ink'>Queue token #{item.queueToken}</p>{queue[item._id] ? <p className='mt-1'>Current position: {queue[item._id].position ?? 'Not waiting'}</p> : <button className='mt-1 font-semibold text-primary underline' onClick={() => loadQueue(item._id)}>Check queue position</button>}</div>}
                            {item.followUp?.recommendedDate && <div className='mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-900'><p className='font-semibold'>Follow-up recommended for {slotDateFormat(item.followUp.recommendedDate)}</p><p className='mt-1'>{item.followUp.reason}</p>{!item.followUp.scheduledAppointmentId && <button className='mt-2 font-semibold underline' onClick={() => navigate(`/appointment/${item.docId}?followUp=${item._id}`)}>Choose a follow-up time</button>}</div>}
                        </div>
                        <div className='flex flex-col gap-2 text-center text-sm lg:min-w-44 lg:justify-end'>
                            {appointmentStatus(item) === 'scheduled' && !item.payment && payment !== item._id && <><button onClick={() => setPayment(item._id)} className='mf-button-secondary'>Choose payment method</button><p className='px-2 text-xs leading-5 text-slate-500'>Payment options are shown only when supported for this appointment.</p></>}
                            {appointmentStatus(item) === 'scheduled' && !item.payment && payment === item._id && <button onClick={() => appointmentStripe(item._id)} className='flex min-h-11 items-center justify-center rounded-lg border border-line py-2 hover:bg-mist'><img className='max-h-5 max-w-20' src={assets.stripe_logo} alt='Continue with Stripe' /></button>}
                            {appointmentStatus(item) === 'scheduled' && !item.payment && payment === item._id && <button onClick={() => appointmentRazorpay(item._id)} className='flex min-h-11 items-center justify-center rounded-lg border border-line py-2 hover:bg-mist'><img className='max-h-5 max-w-20' src={assets.razorpay_logo} alt='Continue with Razorpay' /></button>}
                            {appointmentStatus(item) === 'scheduled' && item.payment && <p className='mf-status justify-center bg-emerald-50 text-emerald-700'>Payment recorded</p>}

                            {appointmentStatus(item) === 'completed' && <p className='mf-status justify-center border border-emerald-200 text-emerald-700'>Completed</p>}

                            {appointmentStatus(item) === 'scheduled' && <button onClick={() => navigate(`/appointment/${item.docId}?reschedule=${item._id}`)} className='mf-button-secondary'>Reschedule</button>}
                            {appointmentStatus(item) === 'scheduled' && <button onClick={() => cancelAppointment(item._id)} className='min-h-11 rounded-lg border border-red-200 px-4 py-2 text-red-700 hover:bg-red-50'>Cancel appointment</button>}
                            {appointmentStatus(item) === 'cancelled' && <p className='mf-status justify-center border border-red-200 text-red-700'>Appointment cancelled</p>}
                            {appointmentStatus(item) === 'no_show' && <p className='mf-status justify-center border border-slate-300 text-slate-700'>Marked no-show</p>}
                        </div>
                    </article>
                ))}
                {appointments.length === 0 && <div className='mf-card p-10 text-center'><p className='text-lg font-semibold text-ink'>No appointments yet</p><p className='mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600'>When you book care, its details and any available payment options will appear here.</p><button onClick={() => navigate('/doctors')} className='mf-button mt-5'>Find a clinician</button></div>}
            </div>
        </section>
    )
}

export default MyAppointments
