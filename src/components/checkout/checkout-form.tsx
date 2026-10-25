"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  confirmPaymentAction,
  paymentFailedAction,
  placeOrderAction,
  quoteAction,
  retryPaymentAction,
  type QuoteSummary,
  type RazorpayPayload,
} from "@/app/(store)/checkout/actions";
import { useCart } from "@/components/cart/cart-context";
import { ArrowIcon, CheckIcon, ChevronIcon, ShieldIcon } from "@/components/icons";
import { Field, FormAlert, SelectField, Spinner, TextAreaField } from "@/components/ui/form";
import { formatPrice } from "@/lib/format";
import { indianStates, type FieldErrors } from "@/lib/validation";
import { openRazorpay } from "./razorpay-client";

export type SavedAddress = {
  id: number;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type Props = {
  user: { email: string; name: string; phone: string | null } | null;
  savedAddresses: SavedAddress[];
  codEnabled: boolean;
  codFee: number;
  razorpayReady: boolean;
  razorpayTestMode: boolean;
};

const emptyAddress = { line1: "", line2: "", city: "", state: "", pincode: "", phone: "" };

function Step({ n, title, children, aside }: { n: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="reveal border-b border-line pb-10 pt-2">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-3 text-3xl sm:text-[2rem]">
          <span className="font-sans text-sm font-medium text-gold">0{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function CheckoutForm({ user, savedAddresses, codEnabled, codFee, razorpayReady, razorpayTestMode }: Props) {
  const router = useRouter();
  const { items, clear } = useCart();
  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [nameParts] = useState(() => (user?.name ?? "").split(" "));

  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(defaultAddress?.name.split(" ")[0] ?? nameParts[0] ?? "");
  const [lastName, setLastName] = useState(defaultAddress?.name.split(" ").slice(1).join(" ") ?? nameParts.slice(1).join(" "));
  const [savedId, setSavedId] = useState<number | "new">(defaultAddress?.id ?? "new");
  const [address, setAddress] = useState(
    defaultAddress
      ? { line1: defaultAddress.line1, line2: defaultAddress.line2 ?? "", city: defaultAddress.city, state: defaultAddress.state, pincode: defaultAddress.pincode, phone: defaultAddress.phone }
      : { ...emptyAddress, phone: user?.phone ?? "" },
  );
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [saveAddress, setSaveAddress] = useState(!defaultAddress);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(razorpayReady || !codEnabled ? "razorpay" : "cod");
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [quoting, startQuote] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [unpaid, setUnpaid] = useState<{ redirectUrl: string; razorpay: RazorpayPayload } | null>(null);

  const lines = useMemo(() => items.map((i) => ({ variantId: i.variantId, qty: i.qty, selections: i.selections })), [items]);

  useEffect(() => {
    if (lines.length === 0) return;
    startQuote(async () => setQuote(await quoteAction({ lines, couponCode: coupon || undefined, paymentMethod })));
  }, [lines, coupon, paymentMethod]);

  const pickSaved = (id: number | "new") => {
    setSavedId(id);
    const a = savedAddresses.find((s) => s.id === id);
    if (a) {
      setAddress({ line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, pincode: a.pincode, phone: a.phone });
      setFirstName(a.name.split(" ")[0]);
      setLastName(a.name.split(" ").slice(1).join(" "));
    } else {
      setAddress({ ...emptyAddress, phone: user?.phone ?? "" });
    }
  };

  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  async function payOnline(payload: RazorpayPayload, redirectUrl: string) {
    const outcome = await openRazorpay(payload, (reason) =>
      void paymentFailedAction({ orderNumber: payload.orderNumber, key: payload.key, reason }),
    );
    if (outcome.status === "paid") {
      const res = await confirmPaymentAction({
        orderNumber: payload.orderNumber,
        key: payload.key,
        razorpayOrderId: outcome.response.razorpay_order_id,
        razorpayPaymentId: outcome.response.razorpay_payment_id,
        signature: outcome.response.razorpay_signature,
      });
      if (!res.ok) {
        setError(res.error ?? "Payment verification failed.");
        return;
      }
      clear();
      router.push(redirectUrl);
    } else {
      setUnpaid({ redirectUrl, razorpay: payload });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});
    setSubmitting(true);
    try {
      const res = await placeOrderAction({
        email,
        firstName,
        lastName,
        address,
        createAccount: !user && createAccount,
        password: createAccount ? password : undefined,
        saveAddress: (Boolean(user) || createAccount) && savedId === "new" && saveAddress,
        note: showNote ? note : undefined,
        // Only send a coupon the server has already accepted; a rejected one just shows its message.
        couponCode: quote?.couponCode ?? undefined,
        paymentMethod,
        lines,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        setErrors(res.fieldErrors ?? {});
        document.querySelector("[aria-invalid=true], [role=alert]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (!res.razorpay) {
        clear();
        router.push(res.redirectUrl);
        return;
      }
      await payOnline(res.razorpay, res.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function retry() {
    if (!unpaid) return;
    setSubmitting(true);
    setError(null);
    const res = await retryPaymentAction({ orderNumber: unpaid.razorpay.orderNumber, key: unpaid.razorpay.key });
    if (!res.ok) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    setUnpaid(null);
    await payOnline(res.razorpay, unpaid.redirectUrl).finally(() => setSubmitting(false));
  }

  if (items.length === 0 && !unpaid) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="font-serif text-4xl">Your bag is empty</p>
        <p className="mt-2 text-muted">Add an attar or a combo pack to check out.</p>
        <Link href="/attar" className="btn btn-dark mt-8">
          Shop Attars <ArrowIcon className="size-4" />
        </Link>
      </div>
    );
  }

  const canPay = paymentMethod === "cod" ? codEnabled : razorpayReady;
  const showSaveAddress = (Boolean(user) || createAccount) && savedId === "new";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
      <div className="min-w-0 space-y-8">
        {unpaid && (
          <div role="alert" className="border border-gold/40 bg-gold/10 p-5">
            <p className="font-medium">Payment not completed</p>
            <p className="mt-1 text-sm text-ink-soft">
              Your order <strong>{unpaid.razorpay.orderNumber}</strong> is saved but unpaid. Complete the payment to confirm it.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={retry} disabled={submitting} className="btn btn-dark h-11">
                {submitting && <Spinner />} Try payment again
              </button>
              <Link href={unpaid.redirectUrl} className="btn btn-outline h-11">
                View order
              </Link>
            </div>
          </div>
        )}
        <FormAlert error={error ?? undefined} />

        <Step
          n={1}
          title="Contact information"
          aside={
            !user && (
              <Link href="/login?next=/checkout" className="link-underline text-sm text-muted hover:text-ink">
                Log in
              </Link>
            )
          }
        >
          {user ? (
            <p className="text-ink-soft">
              Ordering as <strong className="text-ink">{user.email}</strong>. Order updates will be sent here.
            </p>
          ) : (
            <div className="space-y-5">
              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                hint="We'll send your order confirmation and tracking updates here."
              />
              <label className="flex cursor-pointer items-start gap-3 border border-line bg-white p-4 transition-colors has-[:checked]:border-ink">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="mt-1 size-4 accent-[var(--color-ink)]"
                />
                <span>
                  <span className="block font-medium">Create an account with DN Essentia</span>
                  <span className="block text-sm text-muted">Track this and future orders, save addresses and check out faster.</span>
                </span>
              </label>
              {createAccount && (
                <Field
                  label="Choose a password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  hint="At least 8 characters"
                  className="animate-fade-up"
                />
              )}
            </div>
          )}
        </Step>

        <Step n={2} title="Shipping address">
          {savedAddresses.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pickSaved(a.id)}
                  aria-pressed={savedId === a.id}
                  className={`relative border p-4 text-left text-sm transition-colors ${savedId === a.id ? "border-ink bg-white" : "border-line hover:border-ink/40"}`}
                >
                  {savedId === a.id && (
                    <span className="absolute right-3 top-3 grid size-5 animate-pop place-items-center rounded-full bg-ink text-ivory">
                      <CheckIcon className="size-3" strokeWidth={2} />
                    </span>
                  )}
                  <span className="block font-medium">{a.name}</span>
                  <span className="mt-1 block text-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => pickSaved("new")}
                aria-pressed={savedId === "new"}
                className={`border border-dashed p-4 text-left text-sm transition-colors ${savedId === "new" ? "border-ink bg-white" : "border-line hover:border-ink/40"}`}
              >
                + Use a new address
              </button>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" name="firstName" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} />
            <Field label="Last name" name="lastName" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} />
            <Field label="Address" name="line1" autoComplete="address-line1" placeholder="House number and street" required value={address.line1} onChange={setAddr("line1")} error={errors["address.line1"]} className="sm:col-span-2" />
            <Field label="Apartment, landmark (optional)" name="line2" autoComplete="address-line2" value={address.line2} onChange={setAddr("line2")} className="sm:col-span-2" />
            <Field label="City" name="city" autoComplete="address-level2" required value={address.city} onChange={setAddr("city")} error={errors["address.city"]} />
            <SelectField label="State" name="state" options={indianStates} required value={address.state} onChange={setAddr("state")} error={errors["address.state"]} />
            <Field label="PIN code" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={address.pincode} onChange={setAddr("pincode")} error={errors["address.pincode"]} />
            <Field label="Phone" name="phone" type="tel" autoComplete="tel" required value={address.phone} onChange={setAddr("phone")} error={errors["address.phone"]} hint="For delivery updates from the courier" />
          </div>
          {showSaveAddress && (
            <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-[var(--color-ink)]" />
              Save this address to my account
            </label>
          )}
        </Step>

        <Step n={3} title="Payment">
          <div className="space-y-3">
            <PaymentOption
              checked={paymentMethod === "razorpay"}
              onSelect={() => setPaymentMethod("razorpay")}
              disabled={!razorpayReady}
              title="Pay online with Razorpay"
              text={razorpayReady ? "UPI, cards, net banking and wallets. Secured by Razorpay." : "Online payment isn't available yet."}
              badge={razorpayTestMode ? "Test mode" : undefined}
            />
            {codEnabled && (
              <PaymentOption
                checked={paymentMethod === "cod"}
                onSelect={() => setPaymentMethod("cod")}
                title="Cash on Delivery"
                text={codFee ? `Pay when it arrives. ${formatPrice(codFee)} COD fee applies.` : "Pay in cash or UPI when your order arrives."}
              />
            )}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
            <ShieldIcon className="size-4 text-gold" /> Your payment details are handled by Razorpay. We never see your card.
          </p>
        </Step>

        <section className="reveal">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={showNote} onChange={(e) => setShowNote(e.target.checked)} className="size-4 accent-[var(--color-ink)]" />
            Add a note to your order
          </label>
          {showNote && (
            <TextAreaField label="Order note" name="note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="mt-4 animate-fade-up" placeholder="Gift message, delivery instructions…" />
          )}
          <p className="mt-6 text-[13px] text-muted">
            By placing your order you agree to our{" "}
            <Link href="/refund-returns" className="underline underline-offset-4">
              Returns policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline underline-offset-4">
              Privacy policy
            </Link>
            .
          </p>
          <div className="mt-6 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cart" className="link-underline w-fit self-center text-sm text-muted hover:text-ink sm:self-auto">
              ← Return to bag
            </Link>
            <button
              type="submit"
              disabled={submitting || !canPay || Boolean(quote?.errors.length) || Boolean(unpaid)}
              className="btn btn-dark h-14 px-10 text-[13px]"
            >
              {submitting ? <Spinner /> : null}
              {paymentMethod === "cod" ? "Place order" : "Pay"} {quote ? `· ${formatPrice(quote.total)}` : ""}
            </button>
          </div>
        </section>
      </div>

      <OrderSummary
        quote={quote}
        quoting={quoting}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        onApply={() => setCoupon(couponInput.trim().toUpperCase())}
        onRemove={() => {
          setCoupon("");
          setCouponInput("");
        }}
        couponFieldError={errors.couponCode}
      />
    </form>
  );
}

function PaymentOption({
  checked,
  onSelect,
  title,
  text,
  disabled,
  badge,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  text: string;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 border bg-white p-4 transition-colors ${checked ? "border-ink" : "border-line hover:border-ink/40"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input type="radio" name="paymentMethod" checked={checked} onChange={onSelect} disabled={disabled} className="mt-1 size-4 accent-[var(--color-ink)]" />
      <span className="flex-1">
        <span className="flex items-center gap-2 font-medium">
          {title}
          {badge && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold">{badge}</span>}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}

function OrderSummary({
  quote,
  quoting,
  couponInput,
  setCouponInput,
  onApply,
  onRemove,
  couponFieldError,
}: {
  quote: QuoteSummary | null;
  quoting: boolean;
  couponInput: string;
  setCouponInput: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
  couponFieldError?: string;
}) {
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <aside className="order-first lg:order-last">
      <div className="border border-line bg-cream lg:sticky lg:top-28">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 lg:hidden"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-sm">
            {open ? "Hide" : "Show"} order summary ({count})
            <ChevronIcon className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
          <span className="font-serif text-2xl">{quote ? formatPrice(quote.total) : "…"}</span>
        </button>
        <div className={`${open ? "block" : "hidden"} border-t border-line p-5 sm:p-6 lg:block lg:border-t-0`}>
          <h2 className="hidden text-3xl lg:block">Order summary</h2>
          <ul className="divide-y divide-line lg:mt-5">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 py-3">
                <span className="relative aspect-square w-14 shrink-0 bg-white">
                  <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-ink text-[11px] text-ivory">{i.qty}</span>
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-medium">{i.name}</span>
                  <span className="block text-muted">{i.variant}</span>
                  {i.selections?.length ? <span className="block text-[12px] text-muted">{i.selections.join(" · ")}</span> : null}
                </span>
                <span className="text-sm">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            {quote?.couponCode ? (
              <div className="flex items-center justify-between bg-white px-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{quote.couponCode}</span> applied
                  {quote.giftNote && <span className="block text-[12px] text-gold">🎁 {quote.giftNote}</span>}
                </span>
                <button type="button" onClick={onRemove} className="text-muted underline underline-offset-4 hover:text-ink">
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onApply();
                      }
                    }}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    className="h-11 min-w-0 flex-1 border border-line bg-white px-3 text-sm uppercase outline-none focus:border-ink"
                  />
                  <button type="button" onClick={onApply} disabled={!couponInput.trim()} className="btn btn-outline h-11 px-5">
                    Apply
                  </button>
                </div>
                {(quote?.couponError || couponFieldError) && (
                  <p className="mt-2 text-[13px] text-red-700">{quote?.couponError ?? couponFieldError}</p>
                )}
                <p className="mt-2 text-[12px] text-muted">Try FREEGIFT for a free 1ml sample on orders above ₹299.</p>
              </div>
            )}
          </div>

          <dl className={`mt-4 space-y-2 border-t border-line pt-4 text-sm transition-opacity ${quoting ? "opacity-50" : ""}`}>
            <Row label="Subtotal" value={quote ? formatPrice(quote.subtotal) : "…"} />
            {quote && quote.discount > 0 && <Row label="Discount" value={`− ${formatPrice(quote.discount)}`} accent />}
            <Row
              label="Shipping"
              value={quote ? (quote.shippingFee ? formatPrice(quote.shippingFee) : "Free") : "…"}
              hint={quote && quote.shippingFee > 0 ? `Free above ${formatPrice(quote.freeShippingThreshold)}` : undefined}
            />
            {quote && quote.codFee > 0 && <Row label="COD fee" value={formatPrice(quote.codFee)} />}
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="font-serif text-3xl">{quote ? formatPrice(quote.total) : "…"}</dd>
            </div>
            <p className="text-right text-[12px] text-muted">Inclusive of all taxes</p>
          </dl>
          {quote?.errors.length ? <p className="mt-3 text-[13px] text-red-700">{quote.errors[0]}</p> : null}
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">
        {label}
        {hint && <span className="block text-[11px]">{hint}</span>}
      </dt>
      <dd className={accent ? "text-gold" : ""}>{value}</dd>
    </div>
  );
}
