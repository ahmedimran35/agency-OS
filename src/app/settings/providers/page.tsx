import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui";
import { ProviderManager } from "@/components/content-studio/provider-manager";

export const metadata: Metadata = {
  title: "AI Providers, Brightside",
  description: "Point Brightside at any OpenAI-compatible endpoint.",
};

/**
 * Thin page wrapping the reusable provider manager.
 *
 * The same component powers the "⚡ AI Providers" tab in Content Studio, * one implementation, two doorways.
 */
export default function AiProvidersSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading
        icon="speed"
        title="AI Providers"
        description="Bring your own endpoint, any OpenAI-compatible API. We fetch the model list from it, you pick what to use."
      />

      <ProviderManager />
    </div>
  );
}
