import re
from datetime import datetime
from typing import Optional, Tuple

def clean_currency(value: str | None) -> float:
    if not value:
        return 0.0
    # Remove ₹, comma, % and whitespace, keep digits and dots
    clean = re.sub(r'[^\d.-]', '', str(value))
    try:
        return float(clean)
    except ValueError:
        return 0.0

def to_iso(dt):
    return dt.strftime("%Y-%m-%d")

def parse_ipo_date(date_str: str | None) -> Tuple[Optional[str], Optional[str]]:
    if not date_str or date_str.strip() == "" or date_str.strip() == "--":
        return None, None

    date_str = date_str.strip()
    current_year = datetime.now().year

    # Try Range: "20-22 Feb 2026" or "20-22 Feb"
    if "-" in date_str:
        parts = date_str.split("-")
        if len(parts) == 2:
            p1 = parts[0].strip()
            p2 = parts[1].strip()

            # Heuristic: p2 usually contains Month and maybe Year
            # Check if p2 has Month
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            has_month = any(m in p2 for m in months)

            if has_month:
                full_end_str = p2
                if str(current_year) not in full_end_str:
                    full_end_str = f"{full_end_str} {current_year}"

                end_dt = None
                try:
                    end_dt = datetime.strptime(full_end_str, "%d %b %Y")
                except:
                    try:
                         end_dt = datetime.strptime(full_end_str, "%b %d %Y")
                    except:
                        pass

                if end_dt:
                    # p1 is usually just Day (e.g., "20")
                    if p1.isdigit():
                        try:
                            start_dt = datetime(end_dt.year, end_dt.month, int(p1))
                            return to_iso(start_dt), to_iso(end_dt)
                        except:
                            pass
                    # If p1 is also full date? Assume not for now.

    # Try Single Dates
    formats = [
        "%d %b %Y",      # 20 Feb 2026
        "%d %b, %Y",     # 20 Feb, 2026
        "%b %d, %Y",     # Feb 20, 2026
        "%b %d %Y",      # Feb 20 2026
        "%d-%b-%Y",      # 20-Feb-2026
        "%Y-%m-%d"       # 2026-02-20
    ]

    # Try with original string
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return to_iso(dt), to_iso(dt)
        except ValueError:
            continue

    # Try adding current year if missing
    if str(current_year) not in date_str:
        date_str_with_year = f"{date_str} {current_year}"
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str_with_year, fmt)
                return to_iso(dt), to_iso(dt)
            except ValueError:
                continue

    return None, None

def normalize_name(name: str) -> str:
    if not name:
        return ""
    name = name.lower()
    name = re.sub(r'\b(ltd|limited|ipo|private|pvt)\b', '', name)
    name = re.sub(r'[^\w\s]', '', name)
    return name.strip()
