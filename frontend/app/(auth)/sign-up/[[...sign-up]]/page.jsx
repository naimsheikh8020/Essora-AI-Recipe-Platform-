import { SignUp } from '@clerk/nextjs'
import React, { Suspense } from 'react'

const SignUpPage = () => {
  return (
    <div>
      <Suspense
        fallback={
          <div className="h-9 w-20 animate-pulse rounded-full bg-stone-200" />
        }
      >
        <SignUp />
      </Suspense>
    </div>

  )
}

export default SignUpPage