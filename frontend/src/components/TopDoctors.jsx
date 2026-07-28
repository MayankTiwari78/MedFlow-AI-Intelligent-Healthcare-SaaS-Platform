import React, { useContext } from 'react'

import { assets, specialityData } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { imageSrc } from '../lib/imageSrc'
import { Link, useNavigate } from '../lib/routerCompat'
import ClinicianCard from './ClinicianCard'

const availability = (doctor) => {
  if (doctor.available === true) return { label: 'Available to book', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' }
  if (doctor.available === false) return { label: 'Currently unavailable', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  return { label: 'Availability not listed', className: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' }
}

const FeaturedClinician = ({ doctor, onSelect }) => {
  const status = availability(doctor)
  const location = [doctor.address?.line1, doctor.address?.line2].filter(Boolean).join(', ') || 'Location not listed'

  return (
    <article className='mf-card group grid overflow-hidden sm:grid-cols-[.82fr_1.18fr]'>
      <div className='relative min-h-72 overflow-hidden bg-[linear-gradient(145deg,#D9F5F1,#B5E1E2)] sm:min-h-full'>
        <div className='absolute inset-0 mf-tech-grid opacity-50' />
        <img className='relative z-10 h-full min-h-72 w-full object-cover object-top transition duration-300 group-hover:scale-[1.025]' src={imageSrc(doctor.image, assets.profile_pic)} alt={doctor.name || 'Clinician profile'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.profile_pic }} />
        <span className={`mf-status absolute left-4 top-4 z-20 border border-white/80 ${status.className}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span>
      </div>
      <div className='flex flex-col p-6 sm:p-7'>
        <p className='text-xs font-bold uppercase tracking-[.14em] text-teal'>Featured clinician</p>
        <h3 className='mt-3 text-2xl font-semibold tracking-[-.03em] text-ink'>{doctor.name || 'Clinician profile'}</h3>
        <p className='mt-1 text-sm font-semibold text-primary'>{doctor.speciality || 'Speciality not listed'}</p>
        <p className='mt-5 flex items-start gap-2 text-sm leading-6 text-slate-600'><span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E9F9A]' />{location}</p>
        <div className='mt-auto grid grid-cols-1 gap-3 pt-7 sm:grid-cols-2'><button type='button' onClick={onSelect} className='mf-button-secondary'>View profile</button><button type='button' onClick={onSelect} className='mf-button' disabled={doctor.available === false}>Book appointment</button></div>
      </div>
    </article>
  )
}

const CareNavigation = ({ onBrowse }) => (
  <aside className='mf-tech-grid relative overflow-hidden rounded-xl bg-[#082133] p-6 text-white sm:p-7'>
    <div className='absolute -right-16 -top-12 h-48 w-48 rounded-full bg-[#15B9B4]/25 blur-3xl' />
    <div className='relative'><p className='text-xs font-bold uppercase tracking-[.15em] text-[#79E6DE]'>Care navigation</p><h3 className='mt-3 text-2xl font-semibold tracking-[-.03em]'>Find the right care.</h3><p className='mt-3 text-sm leading-6 text-slate-200'>The full directory keeps clinician availability and specialities together as more profiles become available.</p></div>
    <div className='relative mt-6 grid grid-cols-2 gap-2'>
      {specialityData.slice(0, 4).map((item) => <Link to={`/doctors/${item.speciality}`} onClick={() => window.scrollTo(0, 0)} className='rounded-lg border border-white/10 bg-white/[.06] p-3 text-xs font-semibold text-slate-100 transition hover:border-[#6BE4D9]/50 hover:bg-white/10' key={item.speciality}><span className='mb-2 grid h-8 w-8 place-items-center rounded-lg bg-[#E8F8F7]'><img className='w-5' src={item.image} alt='' /></span>{item.speciality}</Link>)}
    </div>
    <div className='relative mt-6 border-t border-white/10 pt-5'><div className='flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.08em] text-[#9BE8E2]'><span>Discover</span><span className='h-px flex-1 bg-[#5BDCD2]/40' /><span>Choose time</span><span className='h-px flex-1 bg-[#5BDCD2]/40' /><span>Manage</span></div><button type='button' onClick={onBrowse} className='mt-5 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#082133] transition hover:bg-[#D5F4F1]'>Browse all doctors</button></div>
  </aside>
)

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors, doctorsLoading, doctorsError, getDoctosData } = useContext(AppContext)
  const browseDoctors = () => { navigate('/doctors'); window.scrollTo(0, 0) }
  const selectDoctor = (doctor) => { navigate(`/appointment/${doctor._id}`); window.scrollTo(0, 0) }
  const featuredDoctors = doctors.slice(0, 3)

  return (
    <section className='mf-section'>
      <div><p className='mf-eyebrow'>Featured care</p><h2 className='mf-title'>Meet your care team</h2><p className='mf-copy'>Profile details, location, and booking actions stay clear from the first look.</p></div>

      {doctorsLoading && <div className='mt-7 grid gap-4 lg:grid-cols-[1.05fr_.95fr]'><div className='mf-card h-[390px] animate-pulse bg-[#EAF3F4]' /><div className='h-[390px] animate-pulse rounded-xl bg-[#0B3044]' /></div>}

      {!doctorsLoading && doctorsError && <div className='mf-card mt-7 p-8 text-center'><p className='text-lg font-semibold text-ink'>The care directory is temporarily unavailable</p><p className='mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600'>{doctorsError}</p><button type='button' onClick={getDoctosData} className='mf-button mt-5'>Try again</button></div>}

      {!doctorsLoading && !doctorsError && doctors.length === 0 && <div className='mf-card mt-7 grid gap-5 p-8 sm:grid-cols-[1fr_auto] sm:items-center'><div><p className='text-lg font-semibold text-ink'>The clinician directory is being prepared</p><p className='mt-2 max-w-xl text-sm leading-6 text-slate-600'>No clinician profiles are available to feature yet. You can still open the directory when profiles are published.</p></div><button type='button' onClick={browseDoctors} className='mf-button w-fit'>Open directory</button></div>}

      {!doctorsLoading && !doctorsError && doctors.length === 1 && <div className='mt-7 grid gap-4 lg:grid-cols-[1.05fr_.95fr]'><FeaturedClinician doctor={doctors[0]} onSelect={() => selectDoctor(doctors[0])} /><CareNavigation onBrowse={browseDoctors} /></div>}

      {!doctorsLoading && !doctorsError && doctors.length >= 2 && <><div className={`mt-7 grid gap-4 ${featuredDoctors.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>{featuredDoctors.map((doctor) => <ClinicianCard doctor={doctor} onSelect={() => selectDoctor(doctor)} key={doctor._id} />)}</div><div className='mt-6 text-center'><button type='button' onClick={browseDoctors} className='mf-button-secondary'>Browse all doctors</button></div></>}
    </section>
  )
}

export default TopDoctors
