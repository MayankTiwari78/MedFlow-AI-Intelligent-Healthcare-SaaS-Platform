import axios from 'axios'
import { useContext, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const allowedPurposes = ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION']

const OtpChallenge = () => {
  const { backendUrl } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const initialPurpose = searchParams.get('purpose')
  const [purpose, setPurpose] = useState(allowedPurposes.includes(initialPurpose) ? initialPurpose : 'EMAIL_VERIFICATION')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async () => {
    setLoading(true)

    try {
      const { data } = await axios.post(backendUrl + '/api/v1/auth/otp/request', { email, purpose }, { withCredentials: true })
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const { data } = await axios.post(backendUrl + '/api/v1/auth/otp/verify', { email, purpose, otp }, { withCredentials: true })
      toast.success(data.message)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={verifyCode} className='min-h-[70vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>Verification Code</p>
        <div className='w-full'>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type='email' required />
        </div>
        <div className='w-full'>
          <p>Purpose</p>
          <select onChange={(e) => setPurpose(e.target.value)} value={purpose} className='border border-[#DADADA] rounded w-full p-2 mt-1'>
            <option value='EMAIL_VERIFICATION'>Email verification</option>
            <option value='PASSWORD_RESET'>Password reset</option>
            <option value='LOGIN_VERIFICATION'>Login verification</option>
          </select>
        </div>
        <button disabled={loading || !email} type='button' onClick={requestCode} className='border border-primary text-primary disabled:opacity-60 w-full py-2 my-1 rounded-md text-base'>Send code</button>
        <div className='w-full'>
          <p>Code</p>
          <input onChange={(e) => setOtp(e.target.value)} value={otp} className='border border-[#DADADA] rounded w-full p-2 mt-1' inputMode='numeric' maxLength='6' required />
        </div>
        <button disabled={loading} className='bg-primary disabled:opacity-60 text-white w-full py-2 my-2 rounded-md text-base'>{loading ? 'Please wait...' : 'Verify code'}</button>
        <Link className='text-primary underline' to='/login'>Back to login</Link>
      </div>
    </form>
  )
}

export default OtpChallenge
