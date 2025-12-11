"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DealSummaryPrintPage() {
  const params = useParams()
  const id = params?.id as string
  const [html, setHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const resp = await fetch(`/api/deals/summary?id=${id}`)
      const text = await resp.text()
      setHtml(text)
    } catch {
      setHtml("<p>Failed to load summary</p>")
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-card p-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : "Deal Summary"}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </Button>
            <Button onClick={handlePrint}>Download PDF</Button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl p-4">
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  )
}
