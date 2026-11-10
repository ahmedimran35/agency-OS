import type { Metadata } from "next";
import { getCampaigns, getClients, getContent } from "@/lib/data";
import { listProviders, toPublicProvider } from "@/lib/ai/store";
import { ContentStudio } from "@/components/content-studio/content-studio";
import {
  toStudioCampaigns,
  toStudioClients,
  toStudioContent,
  type StudioProvider,
} from "@/components/content-studio/types";

export const metadata: Metadata = {
  title: "Content Studio, Brightside",
  description:
    "Brief it, draft it, ship it, without the blank-page panic.",
};

/**
 * The flagship screen.
 *
 * A server component that loads the initial data (clients, campaigns,
 * existing content, configured providers) and hands it to the interactive
 * studio.
 *
 * Note on relative timestamps: `formatRelative` reads the clock, and
 * Next.js 16's Cache Components treat a clock read during prerender as
 * unstable input. So relative times are rendered client-side by
 * <RelativeTime /> rather than on the server.
 */
export default async function ContentStudioPage() {
  const [clients, campaigns, content] = await Promise.all([
    getClients(),
    getCampaigns(),
    getContent(),
  ]);

  const providers: StudioProvider[] = listProviders().map((provider) => {
    const publicProvider = toPublicProvider(provider);
    return {
      id: publicProvider.id,
      label: publicProvider.label,
      kind: publicProvider.kind,
      baseUrl: publicProvider.baseUrl,
      apiKey: publicProvider.apiKey,
      hasApiKey: publicProvider.hasApiKey,
      models: publicProvider.models,
      isDefault: publicProvider.isDefault,
      createdAt: publicProvider.createdAt.toISOString(),
    };
  });

  return (
    <ContentStudio
      clients={toStudioClients(clients)}
      campaigns={toStudioCampaigns(campaigns)}
      initialContent={toStudioContent(content)}
      initialProviders={providers}
    />
  );
}
