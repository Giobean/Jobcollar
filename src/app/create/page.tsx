import { CreateAdSpaceForm } from "@/components/create-ad-space-form";
import { SiteHeader } from "@/components/site-header";

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content"><CreateAdSpaceForm /></main>
    </>
  );
}
