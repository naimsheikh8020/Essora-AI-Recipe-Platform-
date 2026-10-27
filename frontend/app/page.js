import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <Button variant="outline">Button</Button>
      <Button variant="primary">Primary</Button>
    </div>
  );
}
