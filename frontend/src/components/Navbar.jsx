import { useContext, useState } from 'react'
import { NavLink, useNavigate } from '../lib/routerCompat'
import { AppContext } from '../context/AppContext'
import { logoutPatientSession } from '../api/authClient'
import BrandLogo from './BrandLogo'
import { assets } from '../assets/assets'
import { imageSrc } from '../lib/imageSrc'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const { token, setToken, userData, backendUrl } = useContext(AppContext)

  const logout = async () => {
    await logoutPatientSession(backendUrl)
    setToken('')
    navigate('/login')
  }

  return (
    <header className='sticky top-0 z-30 border-b border-white/10 bg-[#061928]/90 text-white shadow-[0_8px_30px_rgba(6,25,40,0.18)] backdrop-blur-xl'>
    <div className='mf-page flex min-h-[76px] items-center justify-between gap-5 px-0 text-sm'>
      <BrandLogo dark onClick={() => navigate('/')} />
      <ul className='hidden items-center gap-2 font-semibold text-slate-200 md:flex'>
        <NavLink to='/' >
          <li className='rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-[#4BE1D3] w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-[#4BE1D3] w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-[#4BE1D3] w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-[#4BE1D3] w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='relative'>
              <button type='button' onClick={() => setShowAccountMenu((current) => !current)} className='flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1 text-left hover:bg-white/10' aria-expanded={showAccountMenu} aria-haspopup='menu' aria-label='Open account menu'>
                <img className='h-9 w-9 rounded-lg border border-white/20 object-cover' src={imageSrc(userData.image, assets.profile_pic)} alt='' onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.profile_pic }} />
                <span className='pr-2 text-xs text-slate-300' aria-hidden='true'>v</span>
              </button>
              <div className={`absolute right-0 top-full z-20 pt-2 text-sm font-medium text-slate-600 ${showAccountMenu ? 'block' : 'hidden'}`} role='menu'>
                <div className='mf-card min-w-52 flex flex-col gap-1 p-2'>
                  {[['My profile', '/my-profile'], ['Health profile', '/health-profile'], ['Medical timeline', '/medical-timeline'], ['Family health', '/family-health'], ['Health card', '/health-card'], ['My appointments', '/my-appointments'], ['Reminders', '/reminders'], ['Security', '/security']].map(([label, destination]) => <button type='button' role='menuitem' onClick={() => { setShowAccountMenu(false); navigate(destination) }} className='rounded px-3 py-2 text-left hover:bg-mist hover:text-primary' key={destination}>{label}</button>)}
                  <button type='button' role='menuitem' onClick={logout} className='rounded px-3 py-2 text-left text-red-700 hover:bg-red-50'>Log out</button>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='hidden rounded-xl border border-[#5DE3D7]/40 bg-[#0B8F9A] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,143,154,0.25)] hover:bg-[#087B85] md:inline-flex'>Get started</button>
        }
        <button type='button' onClick={() => setShowMenu(true)} className='grid h-10 w-10 place-items-center md:hidden' aria-label='Open navigation'><span className='text-2xl' aria-hidden='true'>&#8801;</span></button>

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-40 overflow-hidden bg-[#061928] text-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <BrandLogo compact dark />
            <button type='button' onClick={() => setShowMenu(false)} className='grid h-10 w-10 place-items-center text-2xl' aria-label='Close navigation'>&times;</button>
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-semibold'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' ><p className='px-4 py-2 inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' ><p className='px-4 py-2 inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' ><p className='px-4 py-2 inline-block'>CONTACT</p></NavLink>
            {token && <NavLink onClick={() => setShowMenu(false)} to='/health-profile'><p className='px-4 py-2 inline-block'>HEALTH PROFILE</p></NavLink>}
            {token && <NavLink onClick={() => setShowMenu(false)} to='/medical-timeline'><p className='px-4 py-2 inline-block'>MEDICAL TIMELINE</p></NavLink>}
            {token && <NavLink onClick={() => setShowMenu(false)} to='/family-health'><p className='px-4 py-2 inline-block'>FAMILY HEALTH</p></NavLink>}
            {token && <NavLink onClick={() => setShowMenu(false)} to='/health-card'><p className='px-4 py-2 inline-block'>HEALTH CARD</p></NavLink>}
            {token && <NavLink onClick={() => setShowMenu(false)} to='/reminders'><p className='px-4 py-2 inline-block'>REMINDERS</p></NavLink>}
          </ul>
        </div>
      </div>
    </div>
    </header>
  )
}

export default Navbar
