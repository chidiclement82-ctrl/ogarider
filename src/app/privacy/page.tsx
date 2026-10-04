import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/format";

export const metadata = { title: "Privacy policy" };

const UPDATED = "4 October 2026";

export default function PrivacyPage() {
  const contact = SUPPORT_EMAIL ? (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-orange-700 underline">
      {SUPPORT_EMAIL}
    </a>
  ) : (
    "the contact details on our app store listing"
  );

  return (
    <article className="mx-auto max-w-2xl space-y-6 text-stone-700">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Privacy policy</h1>
        <p className="mt-1 text-sm text-stone-500">Last updated {UPDATED}</p>
      </header>

      <p>
        {APP_NAME} is a food-ordering service. This policy explains what information we collect when
        you use the {APP_NAME} website or app, why we collect it, and the choices you have.
      </p>

      <Section title="Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account details:</strong> your name, email address and a password (stored only in
            scrambled form; we cannot read it).
          </li>
          <li>
            <strong>Order details:</strong> what you order, the delivery address and phone number you
            give at checkout, and any note you write for the restaurant.
          </li>
          <li>
            <strong>Wallet details:</strong> the amounts you report transferring, the name on the bank
            account you sent from, and your wallet history.
          </li>
          <li>
            <strong>Sign-in cookie:</strong> one cookie that keeps you signed in. We do not use
            advertising or tracking cookies.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To take, prepare and deliver your orders and show you their progress.</li>
          <li>To confirm wallet transfers and keep an accurate record of payments and refunds.</li>
          <li>To contact you about an order when needed.</li>
          <li>To prevent fraud and keep the service secure.</li>
        </ul>
      </Section>

      <Section title="Who we share it with">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>The restaurant and delivery rider</strong> for your order see your name, phone
            number, delivery address, order and note.
          </li>
          <li>
            <strong>Paystack</strong>, our payment processor, handles online card and transfer
            payments. We never see or store your card details.
          </li>
          <li>
            <strong>Our hosting provider</strong> stores the service&apos;s data on our behalf.
          </li>
        </ul>
        <p className="mt-2">We do not sell your information or share it for advertising.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your account while it is open. Order and payment records are kept for as long as
          we need them for accounting, tax and dispute purposes.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account at any time from the{" "}
          <Link href="/account" className="font-medium text-orange-700 underline">
            Account page
          </Link>
          . This removes your name, email, phone numbers and delivery addresses. Order amounts and
          payment records are kept without your personal details. You can also ask us to delete your
          account by contacting {contact}.
        </p>
      </Section>

      <Section title="Children">
        <p>{APP_NAME} is not intended for children under 13, and we do not knowingly collect their information.</p>
      </Section>

      <Section title="Changes and contact">
        <p>
          If we change this policy we will update this page and the date above. For any question about
          your information, contact {contact}.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}
