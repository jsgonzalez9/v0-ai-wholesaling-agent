"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ConversationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const resp = await fetch("/api/leads/export")
      const text = await resp.text()
      // naive: just indicate count
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversation Summaries</CardTitle>
          <CardDescription>Trigger and view summaries per lead</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => alert("Use per-lead actions to generate summaries")}>Learn more</Button>
        </CardContent>
      </Card>
    </div>
  )
}
