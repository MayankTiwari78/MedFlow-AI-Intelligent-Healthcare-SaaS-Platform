import React from 'react'

import { assets } from '../assets/assets'
import { imageSrc } from '../lib/imageSrc'

const ClinicianCard = ({ doctor, onSelect }) => {
  const available = doctor.available !== false
  const location = doctor.address?.line2 || doctor.address?.line1 || 'Location available in profile'

  return (
    <article className='mf-card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-[#48C7C5] hover:shadow-[0_22px_45px_rgba(6,25,40,0.16)]'>
      <div className='relative aspect-[4/3] overflow-hidden bg-[#E4F2F1]'>
        <img className='h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.025]' src={imageSrc(doctor.image, assets.profile_pic)} alt={doctor.name || 'Clinician profile'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.profile_pic }} />
        <span className={`mf-status absolute left-4 top-4 border border-white/70 bg-white/95 shadow-sm ${available ? 'text-emerald-700' : 'text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-slate-400'}`} />{available ? 'Available to book' : 'Currently unavailable'}</span>
      </div>
      <div className='flex flex-1 flex-col p-5'>
        <p className='text-lg font-semibold text-ink'>{doctor.name || 'Clinician profile'}</p>
        <p className='mt-1 text-sm font-medium text-primary'>{doctor.speciality || 'Speciality shared in profile'}</p>
        <p className='mt-3 flex items-center gap-2 text-sm text-slate-500'><span className='h-1.5 w-1.5 rounded-full bg-teal/70' />{location}</p>
        <div className='mt-5 grid grid-cols-2 gap-3'>
          <button type='button' onClick={onSelect} className='mf-button-secondary px-3'>View profile</button>
          <button type='button' onClick={onSelect} className='mf-button px-3' disabled={!available}>Book</button>
        </div>
      </div>
    </article>
  )
}

export default ClinicianCard
