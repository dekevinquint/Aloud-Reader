import { NextRequest, NextResponse } from "next/server"

const MOLLIE_API = "https://api.mollie.com/v2"

// Lets a member cancel their own recurring membership.
export async function POST(req: NextRequest) {
  const key = process.env.MOLLIE_API_KEY
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 500 })

try {
  const { customerId, subscriptionId } = await req.json()
  if (!customerId || !subscriptionId) {
    return NextResponse.json({ error: "missing_ids" }, { status: 400 })
  }
  const res = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error("Could not cancel subscription")
  return NextResponse.json({ cancelled: true })
} catch (err) {
  console.error(err)
  return NextResponse.json({ error: "cancel_failed" }, { status: 500 })
}
}
