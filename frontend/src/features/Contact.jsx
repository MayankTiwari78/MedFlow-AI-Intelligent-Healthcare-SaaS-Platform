import React from 'react'

import { assets } from '../assets/assets'

const Contact = () => (
  <main>
    <div className='mf-tech-grid relative overflow-hidden rounded-2xl bg-[#082133] px-6 py-7 text-white sm:px-8'><div className='absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#147FA9]/30 blur-3xl' /><div className='relative max-w-3xl'><p className='text-xs font-bold uppercase tracking-[.16em] text-[#74E8DF]'>Contact MedFlow AI</p><h1 className='mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl'>Support for the practical parts of care.</h1><p className='mt-3 max-w-2xl text-sm leading-6 text-slate-200'>For account, appointment, or care-coordination questions, reach our support team through the channel that suits you.</p></div></div>
    <section className='mt-9 grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[.9fr_1.1fr]'>
      <img className='h-full min-h-64 w-full bg-mist object-cover object-center lg:min-h-[390px]' src={assets.contact_image} alt='MedFlow AI support team' />
      <div className='flex flex-col justify-center p-6 sm:p-8 lg:p-10'><p className='mf-eyebrow'>Care support</p><h2 className='mt-3 text-2xl font-semibold text-ink sm:text-3xl'>We are here to help.</h2>
        <dl className='mt-8 grid gap-5 text-sm sm:grid-cols-2'><div className='rounded-xl bg-mist p-4'><dt className='font-semibold text-ink'>Email</dt><dd className='mt-2'><a className='text-primary hover:underline' href='mailto:support@medflow.ai'>support@medflow.ai</a></dd></div><div className='rounded-xl bg-mist p-4'><dt className='font-semibold text-ink'>Phone</dt><dd className='mt-2'><a className='text-primary hover:underline' href='tel:9729xxxxx13'>9729xxxxx13</a></dd></div><div className='rounded-xl bg-mist p-4 sm:col-span-2'><dt className='font-semibold text-ink'>Office</dt><dd className='mt-2 text-slate-600'>Gurugram, Haryana, India</dd></div></dl>
        <p className='mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950'>For medical emergencies, contact your local emergency service. MedFlow AI does not provide emergency medical advice.</p>
      </div>
    </section>
  </main>
)

export default Contact
