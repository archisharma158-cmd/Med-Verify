import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_horizontal_gradient(width, height, color_stops):
    arr = np.zeros((height, width, 3), dtype=np.float32)
    x_coords = np.linspace(0.0, 1.0, width)

    for c in range(3):
        channel_vals = np.zeros(width, dtype=np.float32)
        for i in range(len(color_stops) - 1):
            pos1, col1 = color_stops[i]
            pos2, col2 = color_stops[i+1]
            mask = (x_coords >= pos1) & (x_coords <= pos2)
            if np.any(mask):
                t = (x_coords[mask] - pos1) / (pos2 - pos1)
                channel_vals[mask] = col1[c] + t * (col2[c] - col1[c])
        arr[:, :, c] = channel_vals

    return Image.fromarray(np.uint8(np.clip(arr, 0, 255)))

def create_corner_water_wave_top():
    width = 1000
    height = 140
    num_frames = 50 # 50 frames
    fps_duration = 60 # 60 ms

    # Smooth horizontal gradient: Mint (#77FFD1) -> Teal (#00D9AA) -> Emerald (#00A86B) -> Deep Green (#004D30)
    color_stops_layer1 = [
        (0.0, (119, 255, 209)), 
        (0.35, (0, 217, 170)),  
        (0.70, (0, 168, 107)),  
        (1.0, (0, 77, 48))      
    ]

    color_stops_layer2 = [
        (0.0, (80, 230, 190)),  
        (0.40, (0, 200, 150)),  
        (0.75, (0, 150, 95)),   
        (1.0, (0, 60, 38))      
    ]

    grad_img1 = create_horizontal_gradient(width, height, color_stops_layer1)
    grad_img2 = create_horizontal_gradient(width, height, color_stops_layer2)

    frames = []

    for f in range(num_frames):
        t = (f / num_frames) * 2 * math.pi

        # Base dark background #081420
        base = Image.new("RGBA", (width, height), (8, 20, 32, 255))

        # Soft ambient glow behind corners
        glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.ellipse([-50, -50, 380, 130], fill=(0, 217, 170, 20))
        glow_draw.ellipse([width - 380, -50, width + 50, 130], fill=(0, 168, 107, 20))
        glow = glow.filter(ImageFilter.GaussianBlur(30))
        base = Image.alpha_composite(base, glow)

        # -------------------------------------------------------------
        # Layer 1: Outer Water Wave (Corner to Center Downward Flow)
        # -------------------------------------------------------------
        scale = 2
        sw, sh = width * scale, height * scale
        mask1 = Image.new("L", (sw, sh), 0)
        draw1 = ImageDraw.Draw(mask1)

        pts1 = [(0, 0)]
        for sx in range(0, sw + 1, 4):
            x = sx / scale
            edge_factor = math.pow(abs(x - width / 2) / (width / 2), 0.85)
            base_curve = 50 + 36 * edge_factor
            ripple = 18 * math.sin(2 * math.pi * x / 380 + t) + 8 * math.cos(2 * math.pi * x / 190 - t)
            sy = (base_curve + ripple) * scale
            pts1.append((sx, sy))
        pts1.append((sw, 0))

        draw1.polygon(pts1, fill=190)
        mask1 = mask1.resize((width, height), Image.Resampling.LANCZOS)

        l1 = grad_img1.copy()
        l1.putalpha(mask1)

        # -------------------------------------------------------------
        # Layer 2: Inner Water Wave (Corner to Center Downward Flow)
        # -------------------------------------------------------------
        mask2 = Image.new("L", (sw, sh), 0)
        draw2 = ImageDraw.Draw(mask2)

        pts2 = [(0, 0)]
        for sx in range(0, sw + 1, 4):
            x = sx / scale
            edge_factor = math.pow(abs(x - width / 2) / (width / 2), 0.65)
            base_curve = 72 + 34 * edge_factor
            ripple = 16 * math.sin(2 * math.pi * (width - x) / 340 - t) + 9 * math.sin(2 * math.pi * x / 170 + t)
            sy = (base_curve + ripple) * scale
            pts2.append((sx, sy))
        pts2.append((sw, 0))

        draw2.polygon(pts2, fill=220)
        mask2 = mask2.resize((width, height), Image.Resampling.LANCZOS)

        l2 = grad_img2.copy()
        l2.putalpha(mask2)

        img = Image.alpha_composite(base, l1)
        img = Image.alpha_composite(img, l2)

        # Quantize to 128 colors for clean GIF compression
        img_p = img.convert("RGB").quantize(colors=128, dither=Image.Dither.NONE)
        frames.append(img_p)

    output_path = os.path.join("docs", "readme-assets", "hero-wave-top.gif")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        optimize=True,
        duration=fps_duration,
        loop=0
    )
    print(f"Clean horizontal gradient top wave saved to {output_path} ({os.path.getsize(output_path)} bytes)")

def create_bottom_water_wave():
    width = 1000
    height = 65
    num_frames = 50
    fps_duration = 60

    color_stops = [
        (0.0, (119, 255, 209)), 
        (0.40, (0, 217, 170)),  
        (0.80, (0, 168, 107)),  
        (1.0, (0, 77, 48))      
    ]
    grad_img = create_horizontal_gradient(width, height, color_stops)

    frames = []

    for f in range(num_frames):
        t = (f / num_frames) * 2 * math.pi

        base = Image.new("RGBA", (width, height), (8, 20, 32, 255))

        scale = 2
        sw, sh = width * scale, height * scale
        mask = Image.new("L", (sw, sh), 0)
        draw = ImageDraw.Draw(mask)

        pts = [(0, 0)]
        for sx in range(0, sw + 1, 4):
            x = sx / scale
            angle1 = (x / 420) * 2 * math.pi + t
            angle2 = (x / 180) * 2 * math.pi - t
            sy = (25 + 14 * math.sin(angle1) + 6 * math.cos(angle2)) * scale
            pts.append((sx, sy))
        pts.append((sw, 0))

        draw.polygon(pts, fill=210)
        mask = mask.resize((width, height), Image.Resampling.LANCZOS)

        l1 = grad_img.copy()
        l1.putalpha(mask)

        img = Image.alpha_composite(base, l1)
        img_p = img.convert("RGB").quantize(colors=128, dither=Image.Dither.NONE)
        frames.append(img_p)

    output_path = os.path.join("docs", "readme-assets", "hero-wave-bottom.gif")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        optimize=True,
        duration=fps_duration,
        loop=0
    )
    print(f"Clean horizontal gradient bottom wave saved to {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    create_corner_water_wave_top()
    create_bottom_water_wave()
