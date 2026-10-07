"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AdSpaceCard } from "./ad-space-card";
import { adSpaces } from "@/lib/data";

export function MarketplaceGrid() {
  const [object, setObject] = useState("All objects");
  const [platform, setPlatform] = useState("All platforms");
  const [maxPrice, setMaxPrice] = useState("Any price");

  const filtered = useMemo(
    () =>
      adSpaces.filter(
        (space) =>
          (object === "All objects" || space.objectType === object) &&
          (platform === "All platforms" || space.platform === platform) &&
          (maxPrice === "Any price" || space.price <= Number(maxPrice)),
      ),
    [object, platform, maxPrice],
  );
  const hasFilters =
    object !== "All objects" ||
    platform !== "All platforms" ||
    maxPrice !== "Any price";

  const reset = () => {
    setObject("All objects");
    setPlatform("All platforms");
    setMaxPrice("Any price");
  };

  return (
    <section className="shell marketplace-content" aria-labelledby="inventory-title">
      <div className="filter-bar">
        <span className="filter-title"><SlidersHorizontal /> Filters</span>
        <label>Object<span className="sr-only"> type</span>
          <select value={object} onChange={(event) => setObject(event.target.value)}>
            {["All objects", "Skateboard", "Hoodie", "Laptop", "Bottle", "Hat", "Shirt"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label>Price
          <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
            <option value="Any price">Any price</option>
            <option value="200">Up to $200</option>
            <option value="500">Up to $500</option>
            <option value="750">Up to $750</option>
          </select>
        </label>
        <label>Platform
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
            {["All platforms", "TikTok", "Instagram", "YouTube"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        {hasFilters && <button className="clear-button" type="button" onClick={reset}><X /> Clear</button>}
      </div>
      <div className="results-row">
        <h2 id="inventory-title">{filtered.length} spaces available</h2>
        <label>Sort by
          <select defaultValue="Featured"><option>Featured</option><option>Price: low to high</option><option>Most viewed</option></select>
        </label>
      </div>
      <div className="card-grid marketplace-grid" aria-live="polite">
        {filtered.map((space) => <AdSpaceCard key={space.id} space={space} />)}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state"><h2>No spaces match those filters.</h2><p>Try widening your price or object selection.</p><button className="button button-dark" onClick={reset}>Clear filters</button></div>
      )}
    </section>
  );
}
