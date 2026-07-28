import React from 'react'

import { assets } from '../assets/assets'
import { Link } from '../lib/routerCompat'

const SignalCard = ({ label, detail, className }) => <div className={`absolute rounded-xl border border-[#6BE4D9]/25 bg-[#061928] p-3 text-white shadow-[0_14px_30px_rgba(0,0,0,0.28)] ${className}`}><p className='text-[10px] font-bold uppercase tracking-[0.13em] text-[#70E7DC]'>{label}</p><p className='mt-1 text-xs font-semibold leading-5 text-slate-100'>{detail}</p></div>

const Header = () => (
  <section className='mf-tech-grid relative isolate min-h-[570px] overflow-hidden rounded-2xl bg-[#061928] text-white shadow-[0_22px_55px_rgba(6,25,40,0.22)] lg:h-[610px] lg:min-h-0'>
    <div className='absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#13B8B3]/20 blur-3xl' /><div className='absolute right-0 top-12 h-72 w-72 rounded-full bg-[#157EAA]/20 blur-3xl' />
    <div className='relative grid min-h-[570px] lg:h-full lg:min-h-0 lg:grid-cols-[1.06fr_.94fr]'>
      <div className='flex flex-col justify-center px-6 py-10 sm:px-9 lg:px-12 lg:py-12'>
        <p className='mf-chip w-fit border-[#6DE5DA]/30 bg-[#0B4050]/70 text-[#8EF1E9]'>Intelligent connected care</p>
        <h1 className='mt-5 max-w-2xl text-[clamp(2.7rem,4.4vw,4.7rem)] font-semibold leading-[.98] tracking-[-0.052em]'>Care that feels <span className='text-[#65E5DB]'>connected</span>, not complicated.</h1>
        <p className='mt-5 max-w-xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7'>Find the right clinician, choose an available appointment time, and return to one private workspace to manage the practical details of care.</p>
        <div className='mt-6 flex flex-col gap-3 sm:flex-row'><Link to='/doctors' className='mf-button bg-[#16A6A8] px-5 hover:bg-[#0C8F96]'>Find a specialist <span aria-hidden='true'>-&gt;</span></Link><a href='#how-it-works' className='inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10'>How it works</a></div>
        <div className='mt-6 max-w-xl rounded-xl border border-white/15 bg-[#082B3E] p-3.5'><div className='grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center'><div><p className='text-[10px] font-bold uppercase tracking-[0.13em] text-[#7FE7DF]'>Care discovery</p><p className='mt-1 text-xs text-slate-200'>Speciality: explore all care</p></div><p className='text-xs text-slate-200'><span className='block text-[10px] font-bold uppercase tracking-[0.13em] text-[#7FE7DF]'>Location</span>Gurugram, Haryana</p><Link to='/doctors' className='rounded-lg bg-white px-3.5 py-2.5 text-center text-xs font-semibold text-[#082133] hover:bg-[#CFF8F4]'>Browse care</Link></div></div>
      </div>
      <div className='relative hidden overflow-hidden lg:block'>
        <div className='absolute inset-x-8 bottom-0 top-10 rounded-t-[140px] border border-[#9BE8E2]/20 bg-[radial-gradient(circle_at_50%_25%,rgba(103,236,222,.22),transparent_38%),linear-gradient(180deg,rgba(16,96,112,.42),rgba(5,27,42,.95))]' />
        <img className='absolute bottom-0 left-1/2 z-10 h-[91%] w-[78%] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_22px_28px_rgba(0,0,0,.32)]' src={assets.header_img} alt='Clinician supporting connected care' />
        <SignalCard label='Availability' detail='Choose an available time' className='left-2 top-16 z-20 w-40' />
        <SignalCard label='Private workspace' detail='Appointments and records in context' className='bottom-16 right-1 z-20 w-48' />
        <div className='absolute bottom-5 left-9 z-20 flex items-center gap-2 rounded-lg border border-[#67E5DB]/25 bg-[#061928] px-3 py-2 text-[11px] text-slate-100'><span className='h-2 w-2 rounded-full bg-[#60E5D7]' />Secure booking flow</div>
      </div>
    </div>
  </section>
)

export default Header
