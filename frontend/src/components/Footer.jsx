import React from 'react'
import BrandLogo from './BrandLogo'
import { Link } from '../lib/routerCompat'

const Footer = () => {
  return (
    <footer className='mt-14 bg-[#061928] text-slate-200'>
      <div className='mf-page grid gap-9 py-11 text-sm sm:grid-cols-[1.5fr_1fr_1.2fr]'>

        <div>
          <BrandLogo dark />
          <p className='mt-4 max-w-sm leading-6 text-slate-300'>Appointments, account protection, and care coordination in one dependable healthcare experience.</p>
        </div>

        <div>
          <p className='mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#76E6DC]'>Explore</p>
          <ul className='flex flex-col gap-2 text-slate-300'>
            <li><Link to='/' className='hover:text-white'>Home</Link></li>
            <li><Link to='/doctors' className='hover:text-white'>Find a clinician</Link></li>
            <li><Link to='/about' className='hover:text-white'>About MedFlow AI</Link></li>
            <li><Link to='/security' className='hover:text-white'>Security</Link></li>
          </ul>
        </div>

        <div>
          <p className='mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#76E6DC]'>Support</p>
          <ul className='flex flex-col gap-2 text-slate-300'>
            <li>Gurugram, Haryana, India</li>
            <li><a className='hover:text-primary' href='tel:9729xxxxx13'>9729xxxxx13</a></li>
            <li><a className='hover:text-primary' href='mailto:support@medflow.ai'>support@medflow.ai</a></li>
          </ul>
        </div>

      </div>
      <div className='border-t border-white/10'>
        <p className='mf-page py-4 text-center text-xs text-slate-400'>MedFlow AI is not an emergency medical service.</p>
      </div>
    </footer>
  )
}

export default Footer
