import React, { useState } from 'react';
import { ArrowRight, MapPin, Tag } from 'lucide-react';
import { CLASS_METADATA, POPULAR_DESTINATIONS, PROMO_OFFERS } from '../data/railDataset';
import { formatCurrencyINR } from '../services/railService';
import { DestinationGuide, PromoOffer } from '../types/rail';

interface OffersDestinationsSectionProps {
  onSelectDestination: (destination: DestinationGuide) => void;
  onApplyOffer: (offer: PromoOffer) => void;
  compactMode?: boolean;
}

const DestinationCard: React.FC<{
  destination: DestinationGuide;
  onSelect: (d: DestinationGuide) => void;
}> = ({ destination, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {!imgError ? (
          <img
            src={destination.imageUrl}
            alt={`${destination.city} landmark and rail gateway`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0B1F3A] to-sky-700 flex flex-col items-center justify-center text-white p-4">
            <MapPin className="w-8 h-8 text-sky-300 mb-2" aria-hidden="true" />
            <span className="font-display font-bold text-lg">{destination.city}</span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/85 via-[#0B1F3A]/20 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute bottom-3.5 left-4 right-4 text-white">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-xl font-bold tracking-tight">{destination.city}</h3>
            <span className="font-mono text-xs text-sky-300 tabular-nums">
              {destination.stationCode}
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-0.5 truncate">{destination.tagline}</p>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <p className="text-sm text-slate-600 leading-relaxed">{destination.description}</p>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 tabular-nums">
            <span>From {destination.popularFromCode}</span>
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span>{destination.sampleDuration}</span>
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span className="font-semibold text-[#0B1F3A] font-mono">
              {formatCurrencyINR(destination.sampleStartingFare)}+
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelect(destination)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explore Trains</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const OffersDestinationsSection: React.FC<OffersDestinationsSectionProps> = ({
  onSelectDestination,
  onApplyOffer,
  compactMode = false,
}) => {
  return (
    <div className="space-y-16">
      {/* Promotional Demo Offers */}
      <section aria-labelledby="offers-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-sky-700 tracking-wide mb-1.5">
              Prototype Demo Offers
            </p>
            <h2
              id="offers-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight"
            >
              Curated Corridor Savings
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Apply any sample promo code below to test instant demo fare calculations and prefill a
            popular route.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMO_OFFERS.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-5 hover:border-sky-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0B1F3A] bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                    <Tag className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                    {offer.code}
                  </span>
                  <span className="text-xs text-slate-500">
                    {offer.suggestedFromCode} → {offer.suggestedToCode} ·{' '}
                    {CLASS_METADATA[offer.suggestedClass].shortName}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0B1F3A] leading-snug">
                  {offer.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{offer.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{offer.validityNote}</span>
                <button
                  type="button"
                  onClick={() => onApplyOffer(offer)}
                  className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-sky-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  Apply &amp; Search
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations */}
      <section
        aria-labelledby="destinations-heading"
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${compactMode ? '' : 'pb-4'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-sky-700 tracking-wide mb-1.5">
              Featured Railway Hubs
            </p>
            <h2
              id="destinations-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight"
            >
              Popular Destinations Across India
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Select any destination city to launch a sample timetable search to Hyderabad, Mumbai,
            Delhi, Chennai, Bengaluru, or Goa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_DESTINATIONS.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              onSelect={onSelectDestination}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
