from typing import List, Dict
from sqlalchemy.orm import Session
from models import IPO, GMPPrice
from scrapers.base import ScrapedIPOData
from scrapers.utils import normalize_name
from scrapers.ipowatch import IPOWatchScraper
from scrapers.investorgain import InvestorGainScraper
from scrapers.chittorgarh import ChittorgarhScraper
from datetime import datetime
from rapidfuzz import process, fuzz

class IPOMergerService:
    def __init__(self, db: Session):
        self.db = db

    def scrape_and_merge(self):
        scrapers = [
            IPOWatchScraper(),
            InvestorGainScraper(),
            ChittorgarhScraper()
        ]

        all_data: List[ScrapedIPOData] = []
        for scraper in scrapers:
            try:
                data = scraper.scrape()
                all_data.extend(data)
            except Exception as e:
                print(f"Error running scraper {scraper.__class__.__name__}: {e}")

        # Group by normalized name with fuzzy matching
        grouped: Dict[str, List[ScrapedIPOData]] = {}

        # Keys of grouped dict are normalized names
        # When processing a new item, check fuzzy match against existing keys

        for item in all_data:
            norm = normalize_name(item.name)
            if not norm: continue

            # Try exact match first
            if norm in grouped:
                grouped[norm].append(item)
                continue

            # Try fuzzy match
            existing_keys = list(grouped.keys())
            if existing_keys:
                # Use partial_ratio or token_set_ratio
                match = process.extractOne(norm, existing_keys, scorer=fuzz.token_set_ratio)
                if match and match[1] > 85: # Threshold
                    matched_key = match[0]
                    grouped[matched_key].append(item)
                    continue

            # New group
            grouped[norm] = [item]

        print(f"Found {len(grouped)} unique IPOs (after fuzzy merge).")

        # Pre-fetch existing IPOs to optimize DB queries
        all_db_ipos = self.db.query(IPO).all()
        existing_map = {}
        for ipo in all_db_ipos:
            n_name = normalize_name(ipo.name)
            if n_name:
                existing_map[n_name] = ipo

        # Merge and Update DB
        for norm_name, items in grouped.items():
            self._process_group(norm_name, items, existing_map)

    def _process_group(self, norm_name: str, items: List[ScrapedIPOData], existing_map: Dict[str, IPO]):
        # Strategy:
        # 1. Base info from Chittorgarh (most detailed), fallback to others.
        # 2. GMP from IPOWatch (reliable), fallback to InvestorGain.

        # Sort items by source priority for details
        # Chittorgarh > IPOWatch > InvestorGain
        def source_priority(item):
            if item.source == 'chittorgarh': return 3
            if item.source == 'ipowatch': return 2
            if item.source == 'investorgain': return 1
            return 0

        items_details_sorted = sorted(items, key=source_priority, reverse=True)
        primary = items_details_sorted[0]

        # Consolidated Fields
        name = primary.name
        ipo_type = primary.ipo_type
        price_band = primary.price_band
        open_date = primary.open_date
        close_date = primary.close_date
        listing_date = primary.listing_date
        lot_size = primary.lot_size
        issue_size = primary.issue_size

        # Fill gaps from others
        for item in items_details_sorted[1:]:
            if not price_band: price_band = item.price_band
            if not open_date: open_date = item.open_date
            if not close_date: close_date = item.close_date
            if not listing_date: listing_date = item.listing_date
            if not lot_size: lot_size = item.lot_size
            if not issue_size: issue_size = item.issue_size

        # Determine Status
        status = "Upcoming"
        today = datetime.now().strftime("%Y-%m-%d")
        if open_date and close_date:
            if today >= open_date and today <= close_date:
                status = "Open"
            elif today > close_date:
                status = "Closed"
            else:
                status = "Upcoming"

        # GMP Logic
        # Priority: IPOWatch > InvestorGain.
        # But if IPOWatch is 0/None and InvestorGain has value, take InvestorGain.
        gmp = 0.0

        # Find item with source 'ipowatch'
        ipowatch_item = next((i for i in items if i.source == 'ipowatch'), None)
        investor_item = next((i for i in items if i.source == 'investorgain'), None)

        if ipowatch_item and ipowatch_item.gmp:
            gmp = ipowatch_item.gmp
        elif investor_item and investor_item.gmp:
            gmp = investor_item.gmp

        # DB Update
        existing_ipo = existing_map.get(norm_name)

        if existing_ipo:
            # Update
            existing_ipo.name = name # Update name to preferred format if changed
            existing_ipo.ipo_type = ipo_type
            if price_band: existing_ipo.price_band = price_band
            if open_date: existing_ipo.open_date = open_date
            if close_date: existing_ipo.close_date = close_date
            if listing_date: existing_ipo.listing_date = listing_date
            if lot_size: existing_ipo.lot_size = lot_size
            if issue_size: existing_ipo.issue_size = issue_size
            existing_ipo.status = status
            self.db.commit()
            ipo_id = existing_ipo.id
        else:
            # Create
            new_ipo = IPO(
                name=name,
                ipo_type=ipo_type,
                price_band=price_band,
                open_date=open_date,
                close_date=close_date,
                listing_date=listing_date,
                lot_size=lot_size,
                issue_size=issue_size,
                status=status
            )
            self.db.add(new_ipo)
            self.db.commit()
            self.db.refresh(new_ipo)
            ipo_id = new_ipo.id

        # Add GMP Entry
        new_gmp = GMPPrice(
            ipo_id=ipo_id,
            price=gmp,
            updated_at=datetime.utcnow()
        )
        self.db.add(new_gmp)
        self.db.commit()
