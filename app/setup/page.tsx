"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Loader2, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

const sqlScripts = [
  {
    name: "001_create_leads_table.sql",
    description: "Create the leads table for storing property owner information",
  },
  {
    name: "002_create_messages_table.sql",
    description: "Create the messages table for conversation history",
  },
  {
    name: "003_create_agent_config_table.sql",
    description: "Create the agent config table for settings",
  },
  {
    name: "004_add_model_tracking.sql",
    description: "Add model tracking columns for AI routing",
  },
]

export default function SetupPage() {
  const [executed, setExecuted] = useState<Record<string, boolean>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    checkDatabaseSetup()
  }, [])

  const checkDatabaseSetup = async () => {
    try {
      const response = await fetch("/api/setup/check")
      if (!response.ok) {
        setError("Failed to check database status")
        return
      }
      const data = await response.json()
      setExecuted(data.executed || {})

      const allDone = sqlScripts.every((script) => data.executed?.[script.name])
      setDbReady(allDone)
    } catch (err) {
      console.log("[v0] Failed to check database setup:", err)
      setError("Unable to check database status. Please try refreshing.")
    }
  }

  const runMigrations = async () => {
    setIsRunning(true)
    setError(null)
    try {
      const response = await fetch("/api/setup/run-migrations", {
        method: "POST",
      })
      const data = await response.json()
      if (data.success) {
        setExecuted(data.executed)
        const allDone = sqlScripts.every((script) => data.executed?.[script.name])
        setDbReady(allDone)
      } else {
        setError(data.error || "Failed to run migrations. Try manual setup below.")
      }
    } catch (err) {
      setError("Error running migrations: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsRunning(false)
    }
  }

  const allExecuted = sqlScripts.every((script) => executed[script.name])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Wholesaling Agent Setup</h1>
          <p className="text-muted-foreground">Initialize your database to get started with the agent</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Database Migration Status</CardTitle>
            <CardDescription>
              {allExecuted
                ? "All migrations completed successfully!"
                : "Run the migrations below to set up your database"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Migration List */}
            <div className="space-y-3">
              {sqlScripts.map((script) => (
                <div
                  key={script.name}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50"
                >
                  {executed[script.name] ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{script.name}</p>
                    <p className="text-sm text-muted-foreground">{script.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={runMigrations} disabled={isRunning || allExecuted} className="flex-1">
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Migrations...
                  </>
                ) : allExecuted ? (
                  "Setup Complete"
                ) : (
                  "Run Migrations"
                )}
              </Button>
              {allExecuted && (
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full" variant="default">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>

            {/* Manual Setup Instructions */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Manual Setup (if automatic fails)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Follow these steps in your Supabase dashboard:
              </p>
              <ol className="text-sm space-y-2 text-blue-800 dark:text-blue-300">
                <li>1. Open your Supabase project dashboard</li>
                <li>2. Go to the SQL Editor section</li>
                <li>3. For each script below, copy the SQL and run it in order:</li>
              </ol>
              <div className="mt-3 space-y-2">
                {sqlScripts.map((script) => (
                  <a
                    key={script.name}
                    href={`/scripts/${script.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    {script.name}
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
