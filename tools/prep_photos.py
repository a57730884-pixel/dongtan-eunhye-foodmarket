# -*- coding: utf-8 -*-
"""
생성한 사진(PNG)을 홈페이지용 JPG 로 다듬습니다.
  python tools/prep_photos.py <원본 폴더>
→ images/photo/*.jpg

· 크기: 첫 화면 1920, 배너 1920, 카드·이야기 1200, 질감 1024
· 색: 채도를 조금 낮추고 대비를 살짝 눌러 필름 사진처럼, 미세한 입자와 가장자리 어둡게(비네팅)
  — 여러 장을 같은 톤으로 맞추기 위한 처리입니다.
"""
import os, sys, random
from PIL import Image, ImageEnhance, ImageFilter, ImageChops, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "images", "photo")
os.makedirs(OUT, exist_ok=True)

# 원본 이름 → (출력 이름, 가로 크기, 좌우 뒤집기)
#  글(제목)은 사진 왼쪽에 얹히므로, 피사체가 왼쪽에 몰린 사진은 좌우로 뒤집어
#  왼쪽을 비워 둡니다. 사진을 뒤집는 것은 눈에 띄지 않으면서 글자리를 만드는 가장 간단한 방법입니다.
MAP = {
    "hero_01b": ("hero-1", 1920, False), "hero_02": ("hero-2", 1920, False), "hero_03": ("hero-3", 1920, False),
    "banner_about": ("banner-about", 1920, False), "banner_donate": ("banner-donate", 1920, True), "banner_use": ("banner-use", 1920, False),
    "banner_archive": ("banner-archive", 1920, False), "banner_transparency": ("banner-transparency", 1920, False), "banner_analyze": ("banner-analyze", 1920, False),
    "card_market": ("card-market", 1200, False), "card_bank": ("card-bank", 1200, False), "card_gnd": ("card-gnd", 1200, False),
    "story_01": ("story-1", 1200, False), "story_02": ("story-2", 1200, False), "story_03": ("story-3", 1200, False), "story_04": ("story-4", 1200, False),
    "texture_linen": ("texture-linen", 1024, False),
}

def grade(img, texture=False):
    img = img.convert("RGB")
    if texture:
        return ImageEnhance.Color(img).enhance(0.6)
    w, h = img.size
    img = ImageEnhance.Color(img).enhance(0.86)        # 채도 조금 낮춤
    img = ImageEnhance.Contrast(img).enhance(0.96)     # 대비 살짝 눌러 필름 느낌
    # 그림자를 살짝 들어 올리고 하이라이트를 눌러 부드럽게 (톤 커브)
    lut = [int(255 * ((i / 255) ** 0.96) * 0.97 + 5) for i in range(256)]
    img = img.point(lut * 3)
    # 따뜻한 색 기울기 (황갈색 강조와 어울리게)
    warm = Image.new("RGB", (w, h), (232, 208, 176))
    img = Image.blend(img, ImageChops.multiply(img, warm), 0.10)
    # 미세한 입자
    grain = Image.effect_noise((w, h), 18).convert("L").filter(ImageFilter.GaussianBlur(0.6))
    img = Image.blend(img, ImageChops.overlay(img, Image.merge("RGB", (grain, grain, grain))), 0.22)
    # 비네팅
    mask = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(mask)
    d.ellipse((-w * 0.25, -h * 0.35, w * 1.25, h * 1.35), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(w, h) * 0.18))
    dark = ImageEnhance.Brightness(img).enhance(0.72)
    img = Image.composite(img, dark, mask)
    return img

done = 0
for name, (out, width, flip) in MAP.items():
    src = os.path.join(SRC, name + ".png")
    if not os.path.exists(src):
        continue
    im = Image.open(src)
    if flip:
        im = ImageOps.mirror(im)
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        if width > im.width:
            im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    im = grade(im, texture=name.startswith("texture"))
    path = os.path.join(OUT, out + ".jpg")
    im.save(path, "JPEG", quality=82, optimize=True, progressive=True)
    done += 1
    print(f"{out}.jpg  {im.width}x{im.height}  {os.path.getsize(path)//1024} KB")
print(f"done: {done} photos → {OUT}")
