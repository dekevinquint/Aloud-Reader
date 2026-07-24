import { NextRequest, NextResponse } from "next/server"

const MOLLIE_API = "https://api.mollie.com/v2"

function authHeaders() {
  const key = process.env.MOLLIE_API_KEY
  if (!key) throw new Error("MOLLIE_API_KEY is not set")
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

// Creates a Mollie payment (and, for the membership plan, a Mollie customer
// to attach the recurring mandate to). We never see or store any card or
// IBAN details ourselves — the shopper enters those on Mollie's own hosted
// checkout page.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const plan = body?.plan === "membership" ? "membership" : "onetime"
    const origin = new URL(req.url).origin

  if (plan === "membership") {
    const customerRes = await fetch(`${MOLLIE_API}/customers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "Aloud member" }),
    })
    if (!customerRes.ok) throw new Error("Could not create Mollie customer")
    const customer = await customerRes.json()

    const paymentRes = await fetch(`${MOLLIE_API}/payments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        amount: { currency: "EUR", value: "5.00" },
        description: "Aloud membership — first payment",
        customerId: customer.id,
        sequenceType: "first",
        method: ["creditcard", "directdebit"],
        redirectUrl: origin,
        webhookUrl: `${origin}/api/webhook`,
      }),
    })
    if (!paymentRes.ok) throw new Error("Could not create Mollie payment")
    const payment = await paymentRes.json()

    const redirectUrl = `${origin}/?payment_id=${payment.id}&plan=membership&customer_id=${customer.id}`
    await fetch(`${MOLLIE_API}/payments/${payment.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ redirectUrl }),
    })

    return NextResponse.json({ url: payment._links.checkout.href })
  }

  const paymentRes = await fetch(`${MOLLIE_API}/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      amount: { currency: "EUR", value: "9.00" },
      description: "Aloud Pro — lifetime",
      method: ["ideal", "creditcard"],
      redirectUrl: origin,
      webhookUrl: `${origin}/api/webhook`,
    }),
  })
    if (!paymentRes.ok) throw new Error("Could not create Mollie payment")
    const payment = await paymentRes.json()

  const redirectUrl = `${origin}/?payment_id=${payment.id}&plan=onetime`
    await fetch(`${MOLLIE_API}/payments/${payment.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ redirectUrl }),
    })

  return NextResponse.json({ url: payment._links.checkout.href })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 })
  }
}
