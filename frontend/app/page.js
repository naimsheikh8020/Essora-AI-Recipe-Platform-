import { Button } from "@/components/ui/button";
import { PricingTable } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <section className="pt-32 pb-20 px-4">
        <Image src="/essora_logo.png" alt="Logo" width={60} height={60} />
        <Button variant="primary" size="xl">Primary</Button>
       
      </section>
    </div>
  );
}
