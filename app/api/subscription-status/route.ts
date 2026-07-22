import { NextRequest, NextResponse } from "next/server"

const MOLLIE_API = "https://api.mollie.com/v2"

// Lets the app re-verify (on load) that a cached membership is still active,
// in case it was cancelled or a renewal payment failed.
export async function GET(req: NextRequest) {
  const key = process.env.MOLLIE_API_KEY
  if (!key) return NextResponse.json({ active: false })

const { searchParams } = new URL(req.url)
  const customerId = searchParams.get("customerId")
  const subscriptionId = searchParams.get("subscriptionId")
  if (!customerId || !subscriptionId) {
    return NextResponse.json({ active: false })
  }

try {
  const res = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return NextResponse.json({ active: false })
  const sub = await res.json()
  return NextResponse.json({ active: sub.status === "active" })
} catch {
  return NextResponse.json({ active: false })
}
}
