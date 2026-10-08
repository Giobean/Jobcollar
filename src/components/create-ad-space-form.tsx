"use client";

import { ArrowRight, Camera, Check, Info, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { calculateRecommendedPrice } from "@/lib/data";

export function CreateAdSpaceForm() {
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2);
  const [videos, setVideos] = useState(5);
  const [price, setPrice] = useState(150);
  const [saved, setSaved] = useState(false);
  const recommended = useMemo(() => calculateRecommendedPrice({ averageViews: 150000, width, height, videoCount: videos, prominence: 4 }), [width, height, videos]);

  return (
    <div className="create-page shell">
      <header className="create-heading"><p className="kicker">Create inventory</p><h1>Create an Ad Space</h1><p>Define one exact physical surface. You can add more surfaces to the same object later.</p><div className="review-trust-note"><ShieldCheck aria-hidden="true" /><span><strong>Built for marketplace trust.</strong> CreatorAdSpace reviews creator profiles before their Ad Spaces become publicly available. You can keep building while we review.</span></div></header>
      <div className="create-progress" aria-label="Step 1 of 3"><span className="active">1 <b>Object & surface</b></span><span>2 <b>Price & videos</b></span><span>3 <b>Publish</b></span></div>
      <form className="create-grid" onSubmit={(event) => { event.preventDefault(); setSaved(true); }}>
        <div className="create-card">
          <fieldset><legend>Your physical object</legend>
            <div className="two-fields"><label>Object type<select required defaultValue="Hat"><option>Hat</option><option>Shirt</option><option>Hoodie</option><option>Laptop</option><option>Skateboard</option><option>Custom object</option></select></label><label>Object name<input required defaultValue="Black Skate Cap" /></label></div>
            <label>Placement location<input required defaultValue="Front panel" aria-describedby="placement-help" /><small id="placement-help">Be specific. Each physical surface is its own listing.</small></label>
            <label className="upload-box compact-upload"><Camera /><strong>Add object photo</strong><span>Show the exact surface clearly · JPG or PNG · 10 MB max</span><span className="button button-light">Choose File</span><input className="sr-only" type="file" accept="image/png,image/jpeg" /></label>
          </fieldset>
          <fieldset><legend>Physical advertising area</legend>
            <div className="dimension-fields"><label>Ad width <span>inches</span><input min=".25" step=".25" type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} /><small>Enter the physical width of the area.</small></label><span aria-hidden="true">×</span><label>Ad height <span>inches</span><input min=".25" step=".25" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} /><small>Enter the physical height of the area.</small></label></div>
            <p className="dimension-announcement"><Ruler /> Available advertising area: {width} inches wide × {height} inches high</p>
            <label>Placement description <span>Optional</span><textarea rows={3} defaultValue="Centered on the front panel and visible during talking-to-camera intros." /></label>
          </fieldset>
          <fieldset><legend>Offer and price</legend>
            <div className="two-fields"><label>Number of videos<select value={videos} onChange={(e) => setVideos(Number(e.target.value))}>{[1, 5, 10, 20, 30].map((value) => <option key={value}>{value}</option>)}</select></label><label>Visibility<select defaultValue="Very prominent"><option>Subtle</option><option>Visible</option><option>Very prominent</option></select></label></div>
            <div className="recommendation"><Sparkles /><span>CreatorAdSpace recommends<strong>${recommended}</strong><small>Based on your creator-provided views, dimensions, visibility, and video count.</small></span></div>
            <label>Your price <span>USD</span><div className="money-input"><span>$</span><input min="1" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div><small>You decide what your Ad Space is worth. We will never change this price automatically.</small></label>
          </fieldset>
        </div>
        <aside className="create-preview">
          <p className="kicker">Listing preview</p><span className="draft-badge">◷ Draft — not visible to advertisers</span><div className="preview-object"><Camera /><div><span>Available Ad Space</span><strong>{width}&quot; × {height}&quot;</strong></div></div>
          <h2>Black Skate Cap</h2><p>Front panel</p><dl><div><dt>Videos</dt><dd>{videos}</dd></div><div><dt>Your price</dt><dd>${price}</dd></div><div><dt>Recommended</dt><dd>${recommended}</dd></div></dl>
          <div className="recommendation-note"><Info /><span>The rectangle is an approximate placement guide, not exact physical scale.</span></div>
          <button className="button button-dark full-button" type="submit">Save & continue <ArrowRight /></button>
          <p className="status-message" role="status">{saved && <><Check /> Draft saved. Submit your creator profile for review when ready.</>}</p>
        </aside>
      </form>
    </div>
  );
}
