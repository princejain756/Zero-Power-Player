#!/usr/bin/env python3
"""
make_macos_icon.py
Applies Apple's official macOS Big Sur/Sonoma Human Interface Guidelines (HIG)
squircle masking, inset padding, and drop shadow to an app icon.
"""

from PIL import Image, ImageDraw, ImageFilter
import os
import sys

def create_macos_icon(input_path, output_path):
    # 1. Load original image
    src = Image.open(input_path).convert("RGBA")
    
    # Target Canvas Size
    CANVAS_SIZE = 1024
    
    # Official Apple HIG dimensions for 1024x1024 canvas:
    # Body size: 824x824, centered at (100, 100)
    # Corner radius: ~185px
    BODY_SIZE = 824
    RADIUS = 185
    OFFSET_X = (CANVAS_SIZE - BODY_SIZE) // 2  # 100
    OFFSET_Y = (CANVAS_SIZE - BODY_SIZE) // 2  # 100
    
    # Resize source image to fill 824x824
    src_resized = src.resize((BODY_SIZE, BODY_SIZE), Image.Resampling.LANCZOS)
    
    # Create high-res mask for anti-aliased squircle (supersample 2x for ultra-smooth edges)
    SCALE = 2
    mask_size = (BODY_SIZE * SCALE, BODY_SIZE * SCALE)
    mask = Image.new("L", mask_size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [(0, 0), (BODY_SIZE * SCALE, BODY_SIZE * SCALE)],
        radius=RADIUS * SCALE,
        fill=255
    )
    mask = mask.resize((BODY_SIZE, BODY_SIZE), Image.Resampling.LANCZOS)
    
    # Apply mask to image
    squircle = Image.new("RGBA", (BODY_SIZE, BODY_SIZE), (0, 0, 0, 0))
    squircle.paste(src_resized, (0, 0), mask)
    
    # Create final 1024x1024 canvas with transparent background
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    
    # Create soft macOS-style drop shadow
    # Layer 1: Ambient shadow (soft, wide)
    shadow_mask = mask.copy()
    shadow_layer = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    shadow_color = Image.new("RGBA", (BODY_SIZE, BODY_SIZE), (0, 0, 0, 70))
    shadow_layer.paste(shadow_color, (OFFSET_X, OFFSET_Y + 12), shadow_mask)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(16))
    
    # Layer 2: Key light shadow (sharper, subtle rim depth)
    key_shadow = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    key_shadow_color = Image.new("RGBA", (BODY_SIZE, BODY_SIZE), (0, 0, 0, 50))
    key_shadow.paste(key_shadow_color, (OFFSET_X, OFFSET_Y + 6), shadow_mask)
    key_shadow = key_shadow.filter(ImageFilter.GaussianBlur(8))
    
    # Composite: Canvas <- Ambient Shadow <- Key Shadow <- Squircle
    canvas = Image.alpha_composite(canvas, shadow_layer)
    canvas = Image.alpha_composite(canvas, key_shadow)
    canvas.paste(squircle, (OFFSET_X, OFFSET_Y), squircle)
    
    canvas.save(output_path, "PNG")
    print(f"✅ Generated Apple HIG squircle icon: {output_path}")

if __name__ == "__main__":
    src_img = sys.argv[1] if len(sys.argv) > 1 else "LOGOUSE THIS.png"
    out_img = sys.argv[2] if len(sys.argv) > 2 else "icon_macos.png"
    create_macos_icon(src_img, out_img)
