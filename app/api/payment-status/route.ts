import { NextRequest, NextResponse } from "next/server"

const MOLLIE_API = "https://api.mollie.com/v2"

function authHeaders() {
  const key = process.env.MOLLIE_API_KEY
  if (!key) throw new Error("MOLLIE_API_KEY is not set")
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }
}

// Confirms a payment with Mollie. For the membership plan, once the first
// payment is paid this also creates the recurring Subscription resource
// (Mollie then handles all future monthly charges automatically).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const plan = searchParams.get("plan") || "onetime"
  const customerId = searchParams.get("customerId")
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 })

try {
  const res = await fetch(`${MOLLIE_API}/payments/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error("Could not fetch payment")
  const payment = await res.json()
  const paid = payment.status === "paid"

  if (!paid) return NextResponse.json({ paid: false })

  if (plan === "membership" && customerId) {
    const existingRes = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions`, {
      headers: authHeaders(),
    })
    const existing = existingRes.ok ? await existingRes.json() : { _embedded: { subscriptions: [] } }
      const active = existing?._embedded?.subscriptions?.find((s: { status: string }) => s.status === "active")

  if (active) {
    return NextResponse.json({ paid: true, plan, subscriptionId: active.id, customerId })
  }

  const origin = new URL(req.url).origin
    const subRes = await fetch(`${MOLLIE_API}/customers/${customerId}/subscriptions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        amount: { currency: "EUR", value: "5.00" },
        interval: "1 month",
        description: "Aloud membership",
        webhookUrl: `${origin}/api/webhook`,
      }),
    })
    if (!subRes.ok) throw new Error("Could not create subscription")
    const sub = await subRes.json()
    return NextResponse.json({ paid: true, plan, subscriptionId: sub.id, customerId })
  }

  return NextResponse.json({ paid: true, plan })
} catch (err) {
  console.error(err)
  return NextResponse.json({ error: "status_check_failed" }, { status: 500 })
}
}
