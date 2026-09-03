"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/track";

export default function B2bCatalogTracker({
  brand,
  category,
  hasKeyword,
  resultCount,
  selectedTags,
}: {
  brand: string;
  category: string;
  hasKeyword: boolean;
  resultCount: number;
  selectedTags: string[];
}) {
  useEffect(() => {
    trackEvent({ event_name: "b2b_catalog_view" });

    const filters = [
      hasKeyword ? { filter_type: "keyword", selected_option_ids: [] } : null,
      category ? { filter_type: "category", selected_option_ids: [category] } : null,
      brand ? { filter_type: "brand", selected_option_ids: [brand] } : null,
      selectedTags.length ? { filter_type: "tag", selected_option_ids: selectedTags } : null,
    ].filter((filter): filter is { filter_type: string; selected_option_ids: string[] } => Boolean(filter));

    for (const filter of filters) {
      trackEvent({
        event_name: "b2b_search_filter",
        event_data: { ...filter, result_count: resultCount },
      });
    }
  }, [brand, category, hasKeyword, resultCount, selectedTags]);

  return null;
}
