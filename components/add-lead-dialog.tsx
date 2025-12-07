"use client"

import type React from "react"

import { useState } from "react"
import type { Lead } from "@/lib/types"
import { createLead } from "@/lib/lead-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadAdded: (lead: Lead) => void
}

export function AddLeadDialog({ open, onOpenChange, onLeadAdded }: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    notes: "",
    arv: "",
    repair_estimate: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { lead, error } = await createLead({
      name: formData.name,
      phone_number: formData.phone_number,
      address: formData.address,
      notes: formData.notes || undefined,
      arv: formData.arv ? Number.parseFloat(formData.arv) : undefined,
      repair_estimate: formData.repair_estimate ? Number.parseFloat(formData.repair_estimate) : undefined,
    })

    if (lead) {
      onLeadAdded(lead)
      onOpenChange(false)
      setFormData({
        name: "",
        phone_number: "",
        address: "",
        notes: "",
        arv: "",
        repair_estimate: "",
      })
    } else {
      alert(error || "Failed to create lead")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the property owner's information to add them to your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Property Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State 12345"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="arv">ARV (Optional)</Label>
                <Input
                  id="arv"
                  type="number"
                  placeholder="200000"
                  value={formData.arv}
                  onChange={(e) => setFormData((prev) => ({ ...prev, arv: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repairs">Repairs (Optional)</Label>
                <Input
                  id="repairs"
                  type="number"
                  placeholder="30000"
                  value={formData.repair_estimate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      repair_estimate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about the lead..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
