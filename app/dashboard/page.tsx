import { getAllLeads, checkDatabaseSetup } from "@/lib/lead-actions"
import { DashboardClient } from "@/components/dashboard-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const dbReady = await checkDatabaseSetup()

  if (!dbReady) {
    redirect("/setup")
  }

  const leads = await getAllLeads()

  return <DashboardClient initialLeads={leads} />
}
