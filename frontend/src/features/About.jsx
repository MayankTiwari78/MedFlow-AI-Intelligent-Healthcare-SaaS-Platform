import React from 'react'

import { assets } from '../assets/assets'

const About = () => (
  <main>
    <div className='mf-tech-grid relative overflow-hidden rounded-2xl bg-[#082133] px-6 py-7 text-white sm:px-8'><div className='absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#15B9B4]/25 blur-3xl' /><div className='relative max-w-3xl'><p className='text-xs font-bold uppercase tracking-[.16em] text-[#74E8DF]'>About MedFlow AI</p><h1 className='mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl'>Healthcare access should feel connected and human.</h1><p className='mt-3 max-w-2xl text-sm leading-6 text-slate-200'>MedFlow AI brings clinician discovery, appointment coordination, and patient account tools into one dependable experience.</p></div></div>
    <section className='mt-9 grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[.9fr_1.1fr]'>
      <img className='h-full min-h-64 w-full bg-mist object-cover object-center lg:min-h-[380px]' src={assets.about_image} alt='Healthcare team collaborating' />
      <div className='flex flex-col justify-center p-6 sm:p-8 lg:p-10'><p className='mf-eyebrow'>Our purpose</p><h2 className='mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl'>Make the practical parts of care easier to navigate.</h2><div className='mt-5 space-y-3 text-sm leading-6 text-slate-600'><p>Finding a clinician and keeping appointment information organised should not add to the stress of arranging care. We focus on clear interfaces, familiar steps, and practical patient tools.</p><p>Our platform is designed around the features patients can use today: clinician profiles, availability-aware booking, appointment management, and account security controls.</p></div></div>
    </section>
    <section className='mf-section'><div className='max-w-2xl'><p className='mf-eyebrow'>Care principles</p><h2 className='mf-title'>Built around confidence, not clutter.</h2></div><div className='mt-8 grid gap-4 md:grid-cols-3'>
      {[['Clear choices', 'Profile details and booking options are presented in a consistent, easy-to-scan format.'], ['Respectful coordination', 'Appointment details, reminders, and follow-up workflows are kept close to the patient workspace.'], ['Account privacy', 'Security and session controls help patients manage access to their own accounts.']].map(([title, copy]) => <article className='mf-card p-6' key={title}><span className='grid h-9 w-9 place-items-center rounded-lg bg-[#E7F4F5] text-sm font-bold text-primary'>{title[0]}</span><h3 className='mt-5 text-xl font-semibold text-ink'>{title}</h3><p className='mt-3 text-sm leading-6 text-slate-600'>{copy}</p></article>)}
    </div></section>
    <section className='rounded-2xl border border-[#C7E5E1] bg-[#EAF7F5] p-7 sm:p-10'><p className='mf-eyebrow'>Privacy and security</p><h2 className='mt-3 text-2xl font-semibold text-ink'>Your account is yours to manage.</h2><p className='mt-3 max-w-3xl text-sm leading-7 text-slate-600'>MedFlow AI provides account protection features and patient-facing controls without turning private health information into a marketing claim. Use the Security area to review the options available for your account.</p></section>
  </main>
)

export default About
