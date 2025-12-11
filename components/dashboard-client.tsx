"use client"

import { useEffect, useState } from "react"
import type { Lead } from "@/lib/types"
import { LeadList } from "@/components/lead-list"
import { LeadDetail } from "@/components/lead-detail"
import { AddLeadDialog } from "@/components/add-lead-dialog"
import { CSVImportDialog } from "@/components/csv-import-dialog"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, Users, TrendingUp, Clock, Settings, Upload } from "lucide-react"

interface DashboardClientProps {
  initialLeads: Lead[]
}

export function DashboardClient({ initialLeads }: DashboardClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)

  const stats = {
    total: leads.length,
    contacted: leads.filter((l) => l.conversation_state !== "cold_lead").length,
    qualified: leads.filter((l) =>
      ["qualified", "offer_made", "offer_accepted", "contract_sent", "contract_signed", "closed"].includes(
        l.conversation_state,
      ),
    ).length,
    pending: leads.filter((l) => ["offer_made", "contract_sent"].includes(l.conversation_state)).length,
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const id = params.get("lead")
      if (id) {
        const found = initialLeads.find((l) => l.id === id) || null
        if (found) setSelectedLead(found)
      }
    } catch {}
  }, [])

  const handleLeadAdded = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev])
  }

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead)
    }
  }

  const handleLeadDeleted = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    if (selectedLead?.id === id) {
      setSelectedLead(null)
    }
  }

  const handleImportComplete = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Wholesaling Agent</h1>
              <p className="text-sm text-muted-foreground">Automated SMS Lead Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </Button>
            <Button variant="outline" onClick={() => setIsCSVImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.contacted}</p>
              <p className="text-sm text-muted-foreground">Contacted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.qualified}</p>
              <p className="text-sm text-muted-foreground">Qualified</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending Response</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Lead List */}
        <div className="w-full border-r border-border md:w-96">
          <LeadList leads={leads} selectedLead={selectedLead} onSelectLead={setSelectedLead} />
        </div>

        {/* Lead Detail */}
        <div className="hidden flex-1 md:block">
          {selectedLead ? (
            <LeadDetail lead={selectedLead} onLeadUpdated={handleLeadUpdated} onLeadDeleted={handleLeadDeleted} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Select a lead to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddLeadDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onLeadAdded={handleLeadAdded} />
      <CSVImportDialog
        open={isCSVImportOpen}
        onOpenChange={setIsCSVImportOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
