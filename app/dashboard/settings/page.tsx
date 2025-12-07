import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings-form"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: config } = await supabase.from("agent_config").select("*").single()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center gap-4 px-6 py-4">
          <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </a>
          <h1 className="text-lg font-semibold text-foreground">Agent Settings</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl p-6">
        <SettingsForm initialConfig={config} />
      </div>
    </div>
  )
}
