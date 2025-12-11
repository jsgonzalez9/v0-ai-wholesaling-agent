import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function buildPdf(lines: Array<{ text: string; x?: number; y?: number }>) {
  const header = "%PDF-1.4\n"
  const objects: string[] = []
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
  const page =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  objects.push(page)
  const contentLines = lines
    .map((l, i) => {
      const x = typeof l.x === "number" ? l.x : 72
      const y = typeof l.y === "number" ? l.y : 720 - i * 18
      const safe = l.text.replace(/[\(\)]/g, "")
      return `BT /F1 12 Tf ${x} ${y} Td (${safe}) Tj ET`
    })
    .join("\n")
  const stream = `4 0 obj\n<< /Length ${contentLines.length + 1} >>\nstream\n${contentLines}\nendstream\nendobj\n`
  objects.push(stream)
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
  let body = ""
  const xrefPositions: number[] = []
  let offset = header.length
  for (const obj of objects) {
    xrefPositions.push(offset)
    body += obj
    offset += obj.length
  }
  const xrefStart = header.length + body.length
  const xref =
    `xref\n0 ${objects.length + 1}\n` +
    `0000000000 65535 f \n` +
    xrefPositions.map((pos) => String(pos).padStart(10, "0") + " 00000 n \n").join("")
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  const pdf = header + body + xref + trailer
  return Buffer.from(pdf, "utf-8")
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const supabase = await createClient()
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single()
    if (error || !lead) return NextResponse.json({ error: "lead not found" }, { status: 404 })
    const lines = [
      { text: "Deal Summary", x: 72, y: 740 },
      { text: `${lead.name} — ${lead.address}`, x: 72, y: 720 },
      { text: `Phone: ${lead.phone_number}` },
      { text: `Status: ${(lead.pipeline_status || "")} (${lead.conversation_state})` },
      { text: `ARV: ${lead.arv ? `$${Number(lead.arv).toLocaleString()}` : "-"}` },
      { text: `Repairs: ${lead.repair_estimate ? `$${Number(lead.repair_estimate).toLocaleString()}` : "-"}` },
      { text: `Mortgage Owed: ${lead.mortgage_owed ? `$${Number(lead.mortgage_owed).toLocaleString()}` : "-"}` },
      { text: `Offer: ${lead.offer_amount ? `$${Number(lead.offer_amount).toLocaleString()}` : "-"}` },
      { text: `Tags: ${(lead.tags || []).join(", ")}` },
      { text: `Score: ${lead.score ?? "-"}` },
      { text: "Notes:" },
      { text: String(lead.notes || "").slice(0, 400) },
    ]
    const pdfBuf = buildPdf(lines)
    return new NextResponse(pdfBuf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="deal-${lead.id}.pdf"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
