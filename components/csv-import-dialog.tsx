"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, FileUp } from "lucide-react"
import { bulkImportLeads } from "@/lib/lead-actions"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    successCount: number
    failedCount: number
    errors: string[]
  } | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResult(null)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        setResult({ successCount: 0, failedCount: 0, errors: ["CSV file is empty"] })
        return
      }

      // Parse CSV header
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .map((h) => h.replace(/"/g, ""))

      const nameIdx = headers.findIndex((h) => h === "name")
      const phoneIdx = headers.findIndex((h) => h === "phone" || h === "phone_number")
      const addressIdx = headers.findIndex((h) => h === "address")
      const notesIdx = headers.findIndex((h) => h === "notes")
      const arvIdx = headers.findIndex((h) => h === "arv")
      const repairIdx = headers.findIndex((h) => h === "repair_estimate" || h === "repairs")

      if (nameIdx === -1 || phoneIdx === -1 || addressIdx === -1) {
        setResult({
          successCount: 0,
          failedCount: 0,
          errors: ["CSV must have columns: name, phone_number, address"],
        })
        return
      }

      const leads = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))

        return {
          name: values[nameIdx] || "",
          phone_number: values[phoneIdx] || "",
          address: values[addressIdx] || "",
          notes: notesIdx >= 0 ? values[notesIdx] : undefined,
          arv: arvIdx >= 0 ? Number.parseInt(values[arvIdx]) || undefined : undefined,
          repair_estimate: repairIdx >= 0 ? Number.parseInt(values[repairIdx]) || undefined : undefined,
        }
      })

      const importResult = await bulkImportLeads(leads)
      setResult(importResult)

      if (importResult.failedCount === 0) {
        setTimeout(() => {
          onImportComplete()
          onOpenChange(false)
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({
        successCount: 0,
        failedCount: 0,
        errors: [`Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`],
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: name, phone_number, address, notes (optional), arv (optional),
            repair_estimate (optional)
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
                id="csv-input"
              />
              <label
                htmlFor="csv-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/50 p-8 hover:bg-card"
              >
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Click to select CSV file</span>
                <span className="text-xs text-muted-foreground">or drag and drop</span>
              </label>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-2">CSV Format Example:</p>
              <pre className="overflow-x-auto text-xs">
                name,phone_number,address John Doe,555-123-4567,123 Main St Jane Smith,555-987-6543,456 Oak Ave
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {result.successCount > 0 && (
              <div className="flex gap-3 rounded-lg bg-green-500/10 p-4">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-700">{result.successCount} leads imported successfully</p>
                </div>
              </div>
            )}

            {result.failedCount > 0 && (
              <div className="space-y-2">
                <div className="flex gap-3 rounded-lg bg-red-500/10 p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-700">{result.failedCount} leads failed</p>
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto rounded-lg bg-muted p-3 space-y-1">
                  {result.errors.map((error, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setResult(null)
                onOpenChange(false)
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
