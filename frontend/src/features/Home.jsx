import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import { useNavigate } from '../lib/routerCompat'

const Home = () => {
  const navigate = useNavigate()
  return (
    <div>
      <Header />
      <section className='relative z-10 mx-auto -mt-5 grid max-w-6xl gap-3 px-3 sm:grid-cols-3 sm:px-6'>
        {[['Care discovery', 'Browse clinician profiles and available appointment times.'], ['One care workspace', 'Manage appointments, follow-ups, and account settings together.'], ['Privacy-aware access', 'Use patient-facing security controls designed around your account.']].map(([title, copy]) => <article className='mf-card border-white/70 p-4 backdrop-blur' key={title}><span className='mb-3 block h-1.5 w-8 rounded-full bg-[#16A6A8]' /><p className='text-sm font-semibold text-ink'>{title}</p><p className='mt-1.5 text-sm leading-6 text-slate-600'>{copy}</p></article>)}
      </section>
      <SpecialityMenu />
      <TopDoctors />
      <section id='how-it-works' className='mf-section'>
        <div className='grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-end'><div><p className='mf-eyebrow'>A connected care journey</p><h2 className='mf-title'>Discover. Book. Manage care.</h2></div><p className='mf-copy max-w-none'>A clear, patient-led flow from finding a clinician through returning to the details that matter.</p></div>
        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          {[['01', 'Discover', 'Explore specialities and clinician profiles in a focused directory.'], ['02', 'Book', 'Choose a suitable available time and confirm the appointment details.'], ['03', 'Manage care', 'Review appointments, queue information, follow-ups, and account settings.']].map(([number, title, copy]) => <article className='mf-card relative overflow-hidden p-6' key={number}><p className='absolute right-5 top-4 text-5xl font-bold tracking-[-.06em] text-[#E4F4F3]'>{number}</p><p className='relative text-sm font-bold text-teal'>{number}</p><h3 className='relative mt-10 text-xl font-semibold text-ink'>{title}</h3><p className='relative mt-3 text-sm leading-6 text-slate-600'>{copy}</p></article>)}
        </div>
        <div className='mt-8'><button type='button' onClick={() => navigate('/doctors')} className='mf-button'>Find a clinician</button></div>
      </section>
      <section className='pb-10 sm:pb-12 lg:pb-14'>
        <div className='mb-8 max-w-2xl'><p className='mf-eyebrow'>Designed for your care workflow</p><h2 className='mf-title'>Useful signals, without the noise.</h2></div>
        <div className='grid gap-4 lg:grid-cols-4 lg:grid-rows-2'>
          <article className='mf-dark-panel mf-tech-grid relative overflow-hidden p-6 lg:col-span-2 lg:row-span-2'><div className='absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#16B5B1]/25 blur-3xl' /><p className='relative text-xs font-bold uppercase tracking-[.14em] text-[#79E6DE]'>Appointments</p><h3 className='relative mt-5 max-w-sm text-2xl font-semibold leading-tight tracking-[-.03em]'>One place to return to the details of upcoming care.</h3><p className='relative mt-3 max-w-md text-sm leading-6 text-slate-300'>Review appointment status, booking information, and supported care updates from a patient-facing workspace.</p><div className='relative mt-6 flex gap-2'><span className='rounded-full bg-white/10 px-3 py-2 text-xs'>Status-aware</span><span className='rounded-full bg-white/10 px-3 py-2 text-xs'>Patient-led</span></div></article>
          <article className='mf-card p-5 lg:col-span-2'><p className='text-xs font-bold uppercase tracking-[.14em] text-teal'>Private records</p><h3 className='mt-3 text-xl font-semibold tracking-[-.025em] text-ink'>Health information stays in your patient experience.</h3><p className='mt-2 text-sm leading-6 text-slate-600'>Use the available profile, timeline, and security tools from your own account workspace.</p></article>
          <article className='mf-card p-5 lg:col-span-2'><p className='text-xs font-bold uppercase tracking-[.14em] text-teal'>Account security</p><h3 className='mt-3 text-xl font-semibold tracking-[-.025em] text-ink'>Controls that keep account access manageable.</h3><p className='mt-2 text-sm leading-6 text-slate-600'>Security and session features are available where supported in your account settings.</p></article>
        </div>
      </section>
      <Banner />
    </div>
  )
}

export default Home
