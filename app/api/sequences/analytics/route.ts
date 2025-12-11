import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: stepLogs } = await supabase
      .from("lead_sequence_steps")
      .select("*, lead_sequences(id, sequence_id, inbound_reply_at)")
      .gte("sent_at", since)
    const { data: seqs } = await supabase.from("sequences").select("id,name")
    const seqMap: Record<string, any> = {}
    for (const s of seqs || []) seqMap[(s as any).id] = s
    const bySeq: Record<string, any> = {}
    const firstSendByLeadSeq: Record<string, string> = {}
    for (const log of stepLogs || []) {
      const seqId = (log as any).lead_sequences?.sequence_id
      if (!seqId) continue
      const key = String(seqId)
      bySeq[key] = bySeq[key] || {
        name: (seqMap[key] as any)?.name || key,
        sent: 0,
        errors: 0,
        queued: 0,
        responses: 0,
        firstResponseMinutes: [] as number[],
        templates: {} as Record<string, { sent: number; replied: number }>,
        dropoffIndex: 0,
        timeline: {} as Record<string, number>,
      }
      const s = bySeq[key]
      if ((log as any).status === "sent") s.sent++
      if ((log as any).status === "error") s.errors++
      if ((log as any).status === "queued") s.queued++
      const day = new Date((log as any).sent_at).toISOString().slice(0, 10)
      s.timeline[day] = (s.timeline[day] || 0) + 1
      const msg = (log as any).metadata?.message
      if (msg) {
        const t = (s.templates[msg] = s.templates[msg] || { sent: 0, replied: 0 })
        if ((log as any).status === "sent") t.sent++
      }
      const lsId = String((log as any).lead_sequence_id)
      if (!firstSendByLeadSeq[lsId] && (log as any).status === "sent") firstSendByLeadSeq[lsId] = (log as any).sent_at
      if ((log as any).step_index > s.dropoffIndex) s.dropoffIndex = (log as any).step_index
    }
    // compute responses
    const { data: enrollments } = await supabase.from("lead_sequences").select("id,sequence_id,inbound_reply_at")
    for (const e of enrollments || []) {
      const key = String((e as any).sequence_id)
      const s = bySeq[key]
      if (!s) continue
      if ((e as any).inbound_reply_at) {
        s.responses++
        const lsId = String((e as any).id)
        const firstSent = firstSendByLeadSeq[lsId]
        if (firstSent) {
          const delta = new Date((e as any).inbound_reply_at).getTime() - new Date(firstSent).getTime()
          s.firstResponseMinutes.push(Math.max(0, Math.round(delta / 60_000)))
        }
        // credit templates naive: mark last template as replied
        // (approximation until message-level linkage)
        for (const tpl of Object.values(s.templates)) {
          if ((tpl as any).sent > 0) (tpl as any).replied++
          break
        }
      }
    }
    // finalize metrics
    for (const [key, s] of Object.entries(bySeq)) {
      const avgFirst = (s as any).firstResponseMinutes
      ;(s as any).avgTimeToFirstResponse = avgFirst.length > 0 ? Math.round(avgFirst.reduce((a: number, b: number) => a + b, 0) / avgFirst.length) : null
      ;(s as any).responseRate = (s as any).sent > 0 ? Number(((s as any).responses / (s as any).sent).toFixed(3)) : 0
      const templates = (s as any).templates
      const best = Object.entries(templates)
        .map(([msg, v]: any) => ({ message: msg, replyRate: v.sent > 0 ? Number((v.replied / v.sent).toFixed(3)) : 0, sent: v.sent }))
        .sort((a, b) => b.replyRate - a.replyRate)
      ;(s as any).bestTemplates = best.slice(0, 10)
    }
    return NextResponse.json({ success: true, analytics: bySeq })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to compute analytics" }, { status: 500 })
  }
}
