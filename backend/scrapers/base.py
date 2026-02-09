from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ScrapedIPOData(BaseModel):
    name: str
    ipo_type: str = Field(..., pattern="^(Mainboard|SME)$")
    price_band: Optional[str] = None
    open_date: Optional[str] = None  # YYYY-MM-DD
    close_date: Optional[str] = None # YYYY-MM-DD
    listing_date: Optional[str] = None # YYYY-MM-DD
    lot_size: int = 0
    issue_size: Optional[str] = None
    gmp: Optional[float] = None
    gmp_updated: datetime = Field(default_factory=datetime.utcnow)
    source: str

class BaseScraper(ABC):
    @abstractmethod
    def scrape(self) -> List[ScrapedIPOData]:
        """
        Scrapes the website and returns a list of ScrapedIPOData.
        """
        pass
