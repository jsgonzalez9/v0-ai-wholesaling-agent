"use client"

import { Button } from "@/components/ui/button"
import { createSupabaseBrowser } from "@/lib/supabase/client"

export default function AuthBar() {
  async function signOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }
  return (
    <div className="fixed top-2 right-2">
      <Button variant="outline" onClick={signOut}>Sign out</Button>
    </div>
  )
}
