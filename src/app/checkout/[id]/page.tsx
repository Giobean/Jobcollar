import { CheckoutForm } from "@/components/checkout-form";
import { SiteHeader } from "@/components/site-header";
import { adSpaces, getAdSpace } from "@/lib/data";

export function generateStaticParams() {
  return adSpaces.map(({ id }) => ({ id }));
}

export default async function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main-content"><CheckoutForm space={getAdSpace(id)} /></main>
    </>
  );
}
