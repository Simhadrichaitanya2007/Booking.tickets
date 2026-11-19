import { CLASS_METADATA, STATIONS, TRAIN_ROUTES } from '../data/railDataset';
import { formatCurrencyINR, formatDuration } from './railService';
import { TravelClass } from '../types/rail';

export function getDemoAssistantReply(
  query: string,
  context?: { fromCode?: string; toCode?: string; travelClass?: TravelClass }
): string {
  const q = query.toLowerCase();

  // Check for class comparisons or explanations
  if (
    q.includes('class') ||
    q.includes('3ac') ||
    q.includes('2ac') ||
    q.includes('1ac') ||
    q.includes('sleeper') ||
    q.includes('chair') ||
    q.includes('difference')
  ) {
    return [
      'Here is a quick guide to Indian Railways travel classes in our prototype:',
      '• Sleeper (SL): Non-AC 3-tier open-window coaches. Most affordable for budget overnight trips.',
      '• AC 3 Tier (3AC): Air-conditioned 3-tier with bedding included. Best balance of comfort and value.',
      '• AC 2 Tier (2AC): Only 2 tiers per bay + privacy curtains and extra headroom.',
      '• First AC (1AC): Private lockable 4-berth cabins & 2-berth coupes for maximum privacy.',
      '• Chair Car (CC): 3+2 reclining day seats on Vande Bharat & Shatabdi routes.',
    ].join('\n');
  }

  // Berth selection tips
  if (q.includes('berth') || q.includes('senior') || q.includes('seat') || q.includes('lower')) {
    return [
      'Berth & Seat Tips for Indian Rail:',
      '• Seniors or travelers avoiding ladders should select Lower Berth (LB) or Side Lower (SL).',
      '• Side Lower (SL) gives great daytime window views and converts into a full bed at night.',
      '• Upper Berth (UB) is quietest for uninterrupted sleep during daytime hours.',
      '• On Vande Bharat & Shatabdi Chair Cars (CC), pick Window Seat (WS) for coastal or ghat scenery.',
    ].join('\n');
  }

  // Destination / route matching against local prototype dataset
  const mentionedStations = STATIONS.filter(
    (s) => q.includes(s.city.toLowerCase()) || q.includes(s.code.toLowerCase())
  );

  if (mentionedStations.length >= 2) {
    const [s1, s2] = mentionedStations;
    const matches = TRAIN_ROUTES.filter(
      (r) =>
        (r.originCode === s1.code && r.destinationCode === s2.code) ||
        (r.originCode === s2.code && r.destinationCode === s1.code)
    );
    if (matches.length > 0) {
      const lines = matches.slice(0, 3).map((t) => {
        const fares = Object.values(t.classes)
          .filter(Boolean)
          .map((c) => `${c!.travelClass} ${formatCurrencyINR(c!.baseFare)}`)
          .join(', ');
        return `• ${t.trainNumber} ${t.trainName} (${t.originCode} → ${t.destinationCode}): ${t.departureTime}–${t.arrivalTime} (${formatDuration(t.durationMinutes)}) · Demo fares: ${fares}`;
      });
      return [
        `Prototype routes between ${s1.city} and ${s2.city}:`,
        ...lines,
        'Note: These are sample schedules for this prototype—not live IRCTC inventory.',
      ].join('\n');
    }
  }

  if (q.includes('goa') || q.includes('konkan')) {
    return [
      'Mumbai to Goa (CSMT → MAO) is one of India’s most scenic rail journeys:',
      '• 22229 CSMT–Madgaon Vande Bharat (CC): Departs 05:25, reaches Goa in 7h 45m — ideal for coastal Western Ghats views.',
      '• 10111 Konkan Kanya Express (SL/3AC/2AC/1AC): Overnight at 23:05, arrives 10:45 AM.',
      'Tip: Try demo promo code COASTAL20 in the search bar for 20% demo savings.',
    ].join('\n');
  }

  if (q.includes('pnr') || q.includes('real') || q.includes('irctc') || q.includes('payment')) {
    return 'AI Rail Journey is an academic & portfolio prototype. It does not connect to IRCTC or Indian Railways, does not verify real PNR numbers, and never collects payment details. All tickets generated use a DEMO-ARJ reference stored locally in your browser.';
  }

  if (q.includes('tip') || q.includes('pack') || q.includes('travel')) {
    return [
      'Smart Indian Rail Travel Tips:',
      '1. Arrive at major junctions (NDLS, CSMT, SC, MAS) 30–40 minutes before departure to locate your platform & coach position.',
      '2. Carry a light chain/padlock for overnight Sleeper/3AC luggage and a valid physical/DigiLocker ID.',
      '3. Prefer 3AC or 2AC on 15+ hour trunk corridors like Delhi–Mumbai or Delhi–Hyderabad.',
    ].join('\n');
  }

  if (context?.fromCode && context?.toCode) {
    const fromSt = STATIONS.find((s) => s.code === context.fromCode);
    const toSt = STATIONS.find((s) => s.code === context.toCode);
    const clsMeta = context.travelClass ? CLASS_METADATA[context.travelClass] : null;
    return [
      `I see you're exploring ${fromSt?.city || context.fromCode} to ${toSt?.city || context.toCode}${clsMeta ? ` in ${clsMeta.label}` : ''}.`,
      'Ask me to compare travel classes (SL, 3AC, 2AC, 1AC, CC), suggest the best berth for your trip, or recommend popular Indian rail corridors!',
    ].join('\n');
  }

  return [
    'Namaste! I am RailMate AI (Demo Assistant mode). I can help you with:',
    '• Comparing Indian rail classes (Sleeper, 3AC, 2AC, 1AC, Chair Car)',
    '• Route ideas (e.g., "Best trains from Mumbai to Goa" or "Delhi to Mumbai")',
    '• Choosing the right berth (Lower, Side Lower, Window Seat)',
    '• Practical travel & packing tips for long-distance trains',
  ].join('\n');
}
