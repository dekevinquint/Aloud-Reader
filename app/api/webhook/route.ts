import { NextRequest, NextResponse } from "next/server"

// Mollie calls this URL whenever a payment's status changes (including
// each future recurring membership charge). This app has no database —
// the client re-checks status live against the Mollie API using the ids
// it already stored — so we just acknowledge receipt.
export async function POST(req: NextRequest) {
  try {
    await req.text()
  } catch {}
  return NextResponse.json({ received: true })
}
