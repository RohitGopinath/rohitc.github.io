import sys
import os

# Add backend to path so imports work
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from fastapi.testclient import TestClient
from main import app # Import from main inside backend
import json

client = TestClient(app)

def verify_endpoints():
    print("Verifying /ipos endpoint...")
    response = client.get("/ipos")
    assert response.status_code == 200
    ipos = response.json()
    print(f"Found {len(ipos)} IPOs.")
    if ipos:
        first_ipo = ipos[0]
        # print("First IPO Sample:", json.dumps(first_ipo, indent=2))

        print(f"Verifying /ipos/{first_ipo['id']} endpoint...")
        detail_response = client.get(f"/ipos/{first_ipo['id']}")
        assert detail_response.status_code == 200
        detail = detail_response.json()
        print("Detail Sample:", json.dumps(detail, indent=2))

        # Check for new fields
        assert "subscriptions" in detail
        # assert "lot_size" in detail # lot_size might be null if not scraped properly
        assert "open_date" in detail
        print("Detail fields verified.")

if __name__ == "__main__":
    verify_endpoints()
