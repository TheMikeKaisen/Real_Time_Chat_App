import { redirect } from 'next/navigation'

const page = () => { 
  // route the home page directly to chat page
  return redirect("/chat");
}

export default page