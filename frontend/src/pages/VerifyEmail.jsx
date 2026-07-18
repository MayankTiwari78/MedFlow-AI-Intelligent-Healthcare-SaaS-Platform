import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const { backendUrl } = useContext(AppContext)
  const [status, setStatus] = useState('Verifying email...')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('Verification link is missing or invalid.')
      return
    }

    axios.post(backendUrl + '/api/v1/auth/verify-email', { token }, { withCredentials: true })
      .then(({ data }) => {
        setStatus(data.message)
        toast.success(data.message)
      })
      .catch((error) => {
        const message = error.response?.data?.message || error.message
        setStatus(message)
        toast.error(message)
      })
  }, [backendUrl, searchParams])

  return (
    <div className='min-h-[60vh] flex items-center justify-center'>
      <div className='w-full max-w-md border rounded-xl p-8 text-center shadow-lg text-[#5E5E5E]'>
        <p className='text-2xl font-semibold text-primary'>Email Verification</p>
        <p className='mt-4'>{status}</p>
        <div className='mt-6 flex justify-center gap-4 text-sm'>
          <Link className='text-primary underline' to='/login'>Login</Link>
          <Link className='text-primary underline' to='/otp?purpose=EMAIL_VERIFICATION'>Use code</Link>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
