import yfinance as yf
from sqlalchemy.orm import Session
from models import MarketIndex
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of NIFTY 50 Stocks (Approximation)
NIFTY_50_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
    "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LICI.NS", "HINDUNILVR.NS",
    "LT.NS", "BAJFINANCE.NS", "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS",
    "ADANIENT.NS", "TATAMOTORS.NS", "KOTAKBANK.NS", "AXISBANK.NS", "NTPC.NS",
    "TITAN.NS", "ULTRACEMCO.NS", "ASIANPAINT.NS", "POWERGRID.NS", "ONGC.NS",
    "BAJAJFINSV.NS", "M&M.NS", "NESTLEIND.NS", "JSWSTEEL.NS", "ADANIPORTS.NS",
    "TATASTEEL.NS", "LTIM.NS", "COALINDIA.NS", "SBILIFE.NS", "BRITANNIA.NS",
    "TECHM.NS", "HINDALCO.NS", "GRASIM.NS", "CIPLA.NS", "WIPRO.NS",
    "EICHERMOT.NS", "DRREDDY.NS", "DIVISLAB.NS", "TATACONSUM.NS", "APOLLOHOSP.NS",
    "BPCL.NS", "HEROMOTOCO.NS", "INDUSINDBK.NS"
]

INDICES = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "SENSEX"
}

def update_market_data(session: Session):
    """
    Fetches real-time data for NIFTY 50, SENSEX, and NIFTY 50 constituents
    and updates the MarketIndex table.
    """
    logger.info("Starting Market Data Update...")

    all_tickers = list(INDICES.keys()) + NIFTY_50_TICKERS

    try:
        # Download data for last 5 days to ensure we have previous close
        # group_by='ticker' ensures we get a MultiIndex if len(tickers) > 1
        data = yf.download(all_tickers, period="5d", group_by='ticker', progress=False)

        for ticker in all_tickers:
            try:
                # Handle different dataframe structures
                if len(all_tickers) == 1:
                    df = data
                else:
                    df = data[ticker]

                # Drop NaN rows
                df = df.dropna()

                if df.empty or len(df) < 2:
                    logger.warning(f"Not enough data for {ticker}")
                    continue

                # Get latest price and previous close
                latest_row = df.iloc[-1]
                prev_row = df.iloc[-2]

                # 'Close' is the current price during market hours in yfinance (usually)
                current_price = float(latest_row['Close'])
                previous_close = float(prev_row['Close'])

                change = current_price - previous_close
                change_percent = (change / previous_close) * 100

                # Determine Name
                name = INDICES.get(ticker, ticker.replace(".NS", ""))

                # Update or Insert DB
                market_index = session.query(MarketIndex).filter(MarketIndex.name == name).first()

                if not market_index:
                    market_index = MarketIndex(name=name)
                    session.add(market_index)

                market_index.current_price = current_price
                market_index.change_percent = round(change_percent, 2)
                market_index.last_updated = latest_row.name.to_pydatetime() if hasattr(latest_row.name, 'to_pydatetime') else None

            except Exception as e:
                logger.error(f"Error processing {ticker}: {e}")
                continue

        session.commit()
        logger.info("Market Data Update Completed Successfully.")

    except Exception as e:
        logger.error(f"Failed to fetch market data: {e}")
        session.rollback()
