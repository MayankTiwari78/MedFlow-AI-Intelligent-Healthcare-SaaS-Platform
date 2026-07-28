import React, { useContext, useEffect, useState } from 'react'

import ClinicianCard from '../components/ClinicianCard'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from '../lib/routerCompat'

const specialities = ['General physician', 'Gynecologist', 'Dermatologist', 'Pediatricians', 'Neurologist', 'Gastroenterologist']

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { doctors, doctorsLoading, doctorsError, getDoctosData } = useContext(AppContext)

  useEffect(() => {
    const bySpeciality = speciality ? doctors.filter((doctor) => doctor.speciality === speciality) : doctors
    const normalizedQuery = query.trim().toLowerCase()
    setFilterDoc(normalizedQuery ? bySpeciality.filter((doctor) => `${doctor.name || ''} ${doctor.speciality || ''}`.toLowerCase().includes(normalizedQuery)) : bySpeciality)
  }, [doctors, speciality, query])

  const chooseSpeciality = (value) => {
    navigate(value === speciality ? '/doctors' : `/doctors/${value}`)
    setShowFilter(false)
  }

  return (
    <section>
      <div className='mf-tech-grid relative overflow-hidden rounded-2xl bg-[#082133] px-6 py-7 text-white sm:px-8'><div className='absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal/25 blur-3xl' /><div className='relative max-w-3xl'><p className='text-xs font-bold uppercase tracking-[.16em] text-[#71E7DD]'>Care discovery system</p><h1 className='mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl'>Find your next clinician.</h1><p className='mt-3 max-w-2xl text-sm leading-6 text-slate-200'>Search the care directory by name or speciality, inspect the profile, then move straight to an available booking flow.</p></div><label className='relative mt-5 block max-w-2xl'><span className='sr-only'>Search clinicians or specialities</span><input value={query} onChange={(event) => setQuery(event.target.value)} className='w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 pl-11 text-sm text-white placeholder:text-slate-300 focus:border-[#70E7DC]' placeholder='Search clinician or speciality' /><span className='absolute left-4 top-1/2 -translate-y-1/2 text-[#70E7DC]' aria-hidden='true'>⌕</span></label></div>
      <div className='mt-7 flex flex-col gap-5 lg:flex-row lg:items-start'>
        <button type='button' onClick={() => setShowFilter((current) => !current)} className='mf-button-secondary justify-between lg:hidden' aria-expanded={showFilter}>Filter specialities <span aria-hidden='true'>v</span></button>
        <aside className={`mf-card w-full shrink-0 p-4 lg:block lg:w-64 ${showFilter ? 'block' : 'hidden'}`} aria-label='Filter clinicians by speciality'>
          <p className='px-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500'>Filter care directory</p>
          <div className='mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col'>
            <button type='button' onClick={() => { navigate('/doctors'); setShowFilter(false) }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium ${!speciality ? 'bg-[#E7F4F5] text-primary' : 'text-slate-600 hover:bg-mist'}`}>All clinicians</button>
            {specialities.map((value) => <button type='button' onClick={() => chooseSpeciality(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium ${speciality === value ? 'bg-[#E7F4F5] text-primary' : 'text-slate-600 hover:bg-mist'}`} key={value}>{value}</button>)}
          </div>
        </aside>
        <div className='min-w-0 flex-1'>
          <div className='mb-5 flex flex-wrap items-center justify-between gap-3'><p className='text-sm text-slate-600'><span className='font-semibold text-ink'>{speciality || 'All specialities'}</span> <span className='mx-1 text-line'>-</span> {doctorsLoading ? 'Loading clinicians' : `${filterDoc.length} profile${filterDoc.length === 1 ? '' : 's'}`}</p>{(speciality || query) && <button type='button' onClick={() => { navigate('/doctors'); setQuery('') }} className='text-sm font-semibold text-primary hover:underline'>Reset directory</button>}</div>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3'>
            {doctorsLoading && Array.from({ length: 6 }).map((_, index) => <div className='mf-card h-[390px] animate-pulse bg-[#EAF3F4]' key={index} />)}
            {!doctorsLoading && filterDoc.map((item) => <ClinicianCard doctor={item} onSelect={() => { navigate(`/appointment/${item._id}`); window.scrollTo(0, 0) }} key={item._id} />)}
          </div>
          {!doctorsLoading && doctorsError && <div className='mf-card mt-2 p-10 text-center text-slate-600'><p className='text-lg font-semibold text-ink'>The clinician directory is temporarily unavailable</p><p className='mx-auto mt-2 max-w-lg text-sm leading-6'>{doctorsError}</p><button type='button' onClick={getDoctosData} className='mf-button mt-5'>Try again</button></div>}
          {!doctorsLoading && !doctorsError && filterDoc.length === 0 && <div className='mf-card p-10 text-center text-slate-600'><p className='text-lg font-semibold text-ink'>No clinicians match this speciality yet</p><p className='mt-2 text-sm leading-6'>Try another speciality or return to the complete clinician directory.</p><button type='button' onClick={() => navigate('/doctors')} className='mf-button-secondary mt-5'>View all clinicians</button></div>}
        </div>
      </div>
    </section>
  )
}

export default Doctors
