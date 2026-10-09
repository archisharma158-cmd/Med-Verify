"""openFDA drug information lookup service."""
from __future__ import annotations

from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.schemas import OpenFDASearchResult

logger = get_logger("openfda_service")

OPENFDA_BASE_URL = "https://api.fda.gov/drug"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
async def _fetch_openfda(endpoint: str, params: dict) -> dict | None:
    """Make a request to openFDA with retry logic."""
    settings = get_settings()
    if settings.OPENFDA_API_KEY:
        params["api_key"] = settings.OPENFDA_API_KEY

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"{OPENFDA_BASE_URL}/{endpoint}", params=params)
        if response.status_code == 404:
            return None
        if response.status_code == 429:
            logger.warning("openfda_rate_limited")
            return None
        response.raise_for_status()
        return response.json()


async def search_drug(
    name: Optional[str] = None,
    manufacturer: Optional[str] = None,
) -> list[OpenFDASearchResult]:
    """Search openFDA for drug label information.
    
    Note: openFDA provides US-centered drug information.
    Results are supplementary and do not verify Indian medicine authenticity.
    """
    settings = get_settings()
    if not settings.check_service_available("openfda"):
        logger.info("openfda_not_configured")
        return []

    results: list[OpenFDASearchResult] = []

    try:
        # Build search query
        search_parts = []
        if name:
            search_parts.append(f'openfda.brand_name:"{name}"')
        if manufacturer:
            search_parts.append(f'openfda.manufacturer_name:"{manufacturer}"')

        if not search_parts:
            return []

        search_query = "+AND+".join(search_parts)
        params = {"search": search_query, "limit": "5"}

        data = await _fetch_openfda("label.json", params)
        if not data or "results" not in data:
            # Try generic name search as fallback
            if name:
                params = {"search": f'openfda.generic_name:"{name}"', "limit": "5"}
                data = await _fetch_openfda("label.json", params)

        if not data or "results" not in data:
            return []

        for item in data["results"][:5]:
            openfda = item.get("openfda", {})
            brand_names = openfda.get("brand_name", [])
            generic_names = openfda.get("generic_name", [])
            manufacturers = openfda.get("manufacturer_name", [])
            routes = openfda.get("route", [])
            product_type = openfda.get("product_type", [])

            # Extract active ingredients
            active_ingredients = []
            spl_ingredients = openfda.get("substance_name", [])
            if spl_ingredients:
                active_ingredients = spl_ingredients[:10]

            dosage_form = None
            if "dosage_form" in openfda:
                dosage_form = openfda["dosage_form"][0] if openfda["dosage_form"] else None

            results.append(OpenFDASearchResult(
                brand_name=brand_names[0] if brand_names else None,
                generic_name=generic_names[0] if generic_names else None,
                manufacturer_name=manufacturers[0] if manufacturers else None,
                active_ingredients=active_ingredients,
                dosage_form=dosage_form,
                route=routes[0] if routes else None,
                product_type=product_type[0] if product_type else None,
            ))

        logger.info("openfda_search_completed", results_count=len(results))

    except httpx.TimeoutException:
        logger.warning("openfda_timeout")
    except Exception as e:
        logger.error("openfda_error", error=str(e))

    return results
