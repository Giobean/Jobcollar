import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteHeader } from "@/components/site-header";
import { getPurchasableAdSpace, publicAdSpaces } from "@/lib/data";

export function generateStaticParams() {
  return publicAdSpaces.map(({ id }) => ({ id }));
}

export default async function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const space = getPurchasableAdSpace(id);
  if (!space) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main-content"><CheckoutForm space={space} /></main>
    </>
  );
}
