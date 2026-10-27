import { SignIn } from '@clerk/nextjs'
import React from 'react'
import { Suspense } from "react";

const SignInPage = () => {
  return (
    <div>
      <Suspense
        fallback={
          <div className="h-9 w-20 animate-pulse rounded-full bg-stone-200" />
        }
      >
        <SignIn />
      </Suspense>
    </div>

  )
}

export default SignInPage