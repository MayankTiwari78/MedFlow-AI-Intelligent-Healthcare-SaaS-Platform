import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from '../lib/routerCompat'

const SpecialityMenu = () => {
    return (
        <section id='speciality' className='mf-section'>
            <div className='flex flex-col items-center gap-2 text-center'>
              <p className='mf-eyebrow'>Start with what you need</p>
              <h2 className='mf-title'>Care across every speciality</h2>
              <p className='mf-copy'>Browse experienced clinicians and move from discovery to booking in a few calm, clear steps.</p>
            </div>
            <div className='mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                {specialityData.map((item, index) => (
                    <Link to={`/doctors/${item.speciality}`} onClick={() => window.scrollTo(0, 0)} className='mf-card group flex min-h-40 flex-col items-center justify-center gap-4 px-3 py-5 text-center text-sm font-semibold text-ink transition duration-200 hover:-translate-y-1 hover:border-[#49CAC5] hover:bg-[#F7FFFE]' key={index}>
                        <span className='grid h-16 w-16 place-items-center rounded-2xl bg-[#E8F8F7] transition duration-200 group-hover:scale-105 group-hover:bg-[#D5F4F1]'><img className='w-11' src={item.image} alt="" /></span>
                        <p>{item.speciality}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}

export default SpecialityMenu
