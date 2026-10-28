// "use client"
// import { UserButton } from '@clerk/nextjs'
// import { Cookie, Refrigerator } from 'lucide-react'
// import React from 'react'

// const UserDropdown = () => {
//   return (
//     <UserButton >
//       <UserButton.MenuItems>
//         <UserButton.Link
//           label="My Recipes"
//           labelIcon={<Cookie size={16} />}
//           href='/recipes'
//         />

//         <UserButton.Link
//           label="My Pantry"
//           labelIcon={<Refrigerator size={16} />}
//           href='/pantry'
//         />
//         <UserButton.Action label='manageAccount' />
//       </UserButton.MenuItems>
//     </UserButton>
//   )
// }

// export default UserDropdown


"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Cookie, Refrigerator } from "lucide-react";

const UserDropdown = () => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="My Recipes"
          labelIcon={<Cookie size={16} />}
          href="/recipes"
        />

        <UserButton.Link
          label="My Pantry"
          labelIcon={<Refrigerator size={16} />}
          href="/pantry"
        />

        <UserButton.Action label="manageAccount" />
      </UserButton.MenuItems>
    </UserButton>
  );
};

export default UserDropdown;
