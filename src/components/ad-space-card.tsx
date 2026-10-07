import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Eye, Play } from "lucide-react";
import { AdSpace, formatViews } from "@/lib/data";

export function AdSpaceCard({ space }: { space: AdSpace }) {
  return (
    <article className="space-card">
      <Link
        className="space-image-link"
        href={`/spaces/${space.id}`}
        aria-label={`View ${space.objectName}, ${space.placement}, from ${space.creator}`}
      >
        <Image
          className="space-image"
          src={space.image}
          alt={space.imageAlt}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        <span className="availability">
          <span aria-hidden="true">●</span> {space.availability}
        </span>
        <span
          className="area-overlay"
          style={{ "--accent": space.accent } as React.CSSProperties}
        >
          <span>Ad space</span>
          <strong>
            {space.width}&quot; × {space.height}&quot;
          </strong>
        </span>
      </Link>
      <div className="space-card-body">
        <div className="creator-line">
          <span className="avatar" aria-hidden="true">
            {space.creator
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <strong>{space.creator}</strong>
            <span>
              {space.category} · {space.platform}
            </span>
          </div>
        </div>
        <div className="space-title-row">
          <div>
            <p className="eyebrow">{space.placement}</p>
            <h3>{space.objectName}</h3>
          </div>
          <Link
            className="icon-link"
            href={`/spaces/${space.id}`}
            aria-label={`View ${space.objectName}`}
          >
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <div className="space-stats" aria-label="Listing details">
          <span>
            <Eye aria-hidden="true" /> {formatViews(space.averageViews)} avg.
            views
          </span>
          <span>
            <Play aria-hidden="true" /> {space.videos} videos
          </span>
        </div>
        <div className="price-row">
          <span>
            <strong>${space.price}</strong> total
          </span>
          <span>${Math.round(space.price / space.videos)}/video</span>
        </div>
      </div>
    </article>
  );
}
