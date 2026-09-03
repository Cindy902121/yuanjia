"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics/track";

type B2bCatalogTrackerProps = {
  brand: string;
  category: string;
  hasKeyword: boolean;
  selectedTags: string[];
};

/**
 * Keeps event collection at the catalog route boundary, so changing a
 * server-rendered filter URL is recorded after the matching result state has
 * been rendered. This branch's analytics API accepts only event names (and an
 * optional product id), so filter details are deliberately not sent yet.
 */
export default function B2bCatalogTracker({
  brand,
  category,
  hasKeyword,
  selectedTags,
}: B2bCatalogTrackerProps) {
  useEffect(() => {
    trackEvent({ event_name: "b2b_catalog_view" });

    if (hasKeyword || category || brand || selectedTags.length) {
      trackEvent({ event_name: "b2b_search_filter" });
    }
  }, [brand, category, hasKeyword, selectedTags]);

  return null;
}
