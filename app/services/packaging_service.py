"""Packaging image analysis service using OpenCV."""
from __future__ import annotations

import io
from typing import Optional

import cv2
import numpy as np
from PIL import Image
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.models import ReferencePackaging

logger = get_logger("packaging_service")


def _load_image(image_bytes: bytes) -> np.ndarray:
    """Load image from bytes into OpenCV format."""
    pil_image = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(pil_image)
    if len(img_array.shape) == 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    return img_array


def _compute_histogram(image: np.ndarray) -> np.ndarray:
    """Compute color histogram for image comparison."""
    if len(image.shape) == 3:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist(
            [hsv], [0, 1], None, [50, 60], [0, 180, 0, 256]
        )
    else:
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return hist


def _compute_structural_similarity(img1: np.ndarray, img2: np.ndarray) -> float:
    """Compute a simple structural similarity between two images."""
    # Resize both to same dimensions
    target_size = (300, 300)
    resized1 = cv2.resize(img1, target_size)
    resized2 = cv2.resize(img2, target_size)

    # Convert to grayscale
    if len(resized1.shape) == 3:
        gray1 = cv2.cvtColor(resized1, cv2.COLOR_BGR2GRAY)
    else:
        gray1 = resized1
    if len(resized2.shape) == 3:
        gray2 = cv2.cvtColor(resized2, cv2.COLOR_BGR2GRAY)
    else:
        gray2 = resized2

    # Compute histogram similarity
    hist1 = _compute_histogram(resized1)
    hist2 = _compute_histogram(resized2)
    hist_similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

    # Template matching score
    result = cv2.matchTemplate(gray1, gray2, cv2.TM_CCOEFF_NORMED)
    template_score = float(np.max(result))

    # ORB feature matching
    orb = cv2.ORB_create(nfeatures=500)
    kp1, des1 = orb.detectAndCompute(gray1, None)
    kp2, des2 = orb.detectAndCompute(gray2, None)

    feature_score = 0.0
    if des1 is not None and des2 is not None and len(des1) > 0 and len(des2) > 0:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        if matches:
            good_matches = [m for m in matches if m.distance < 50]
            feature_score = len(good_matches) / max(len(matches), 1)

    # Weighted combination
    similarity = (hist_similarity * 0.4) + (template_score * 0.3) + (feature_score * 0.3)
    return max(0.0, min(1.0, similarity))


def _detect_damage_indicators(image: np.ndarray) -> list[str]:
    """Detect potential damage or tampering indicators in packaging image."""
    indicators: list[str] = []

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Check for blur (may indicate tampered labels)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 50:
        indicators.append("Image appears blurry; packaging details may not be fully visible.")

    # Edge detection for torn/damaged packaging
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.count_nonzero(edges) / edges.size

    if edge_density > 0.3:
        indicators.append("High edge density detected; possible damaged or re-sealed packaging.")
    elif edge_density < 0.02:
        indicators.append("Very low detail in image; packaging may be blank or obscured.")

    return indicators


async def analyze_packaging(
    db: AsyncSession,
    image_bytes: bytes,
    medicine_name: Optional[str] = None,
    medicine_id: Optional[str] = None,
) -> dict:
    """Analyze packaging image against reference images and for damage indicators.
    
    Only compares against appropriately sourced reference images.
    Returns uncertainty rather than definitive tampering claims.
    """
    result = {
        "status": "not_checked",
        "similarity_score": None,
        "damage_indicators": [],
        "details": "",
        "notes": [],
    }

    try:
        uploaded_image = _load_image(image_bytes)

        # Check for damage indicators
        damage = _detect_damage_indicators(uploaded_image)
        result["damage_indicators"] = damage

        # Look for reference images
        if not medicine_id and not medicine_name:
            result["details"] = "No reference images available for comparison."
            result["notes"].append(
                "Packaging analysis requires reference images from verified sources. "
                "Without reference data, visual comparison cannot be performed."
            )
            return result

        # Query reference images
        query = select(ReferencePackaging)
        if medicine_id:
            query = query.where(ReferencePackaging.medicine_id == medicine_id)
        query = query.limit(5)

        ref_result = await db.execute(query)
        references = list(ref_result.scalars().all())

        if not references:
            result["details"] = "No reference packaging images found for this medicine."
            result["status"] = "insufficient_reference"
            result["notes"].append(
                "No verified reference images are available for comparison. "
                "Visual packaging analysis cannot confirm or deny authenticity."
            )
            return result

        # TODO: Load reference images from Supabase Storage
        # For now, note that comparison requires stored reference images
        result["status"] = "insufficient_reference"
        result["details"] = "Reference image comparison infrastructure available; reference images pending."
        result["notes"].append(
            "Packaging comparison results should be treated as preliminary indicators, "
            "not definitive proof of tampering or authenticity."
        )

        if damage:
            result["notes"].extend(damage)

        return result

    except Exception as e:
        logger.error("packaging_analysis_error", error=str(e))
        result["status"] = "not_checked"
        result["details"] = "Packaging analysis encountered an error."
        return result
