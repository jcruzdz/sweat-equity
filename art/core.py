"""Drawing core: rectangle fills on a low-resolution canvas.
Every sprite is its own RGBA image. Light comes from the top left."""
from PIL import Image, ImageDraw
import colorsys, random

NAVY = '#2d2a44'

def hexa(c, a=255):
    c = c.lstrip('#'); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)

def tohex(c): return '#%02x%02x%02x' % tuple(c[:3])

def new(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def P(im, x, y, w, h, c, a=255):
    """An opaque rectangle, or a true alpha blend when a < 255."""
    if w <= 0 or h <= 0: return
    if a == 255:
        ImageDraw.Draw(im).rectangle([x, y, x + w - 1, y + h - 1], fill=hexa(c)); return
    lay = new(*im.size); ImageDraw.Draw(lay).rectangle([x, y, x + w - 1, y + h - 1], fill=hexa(c, a)); im.alpha_composite(lay)

def hs(c, k):
    """Shades with a hue shift: darker moves toward blue-violet and gains saturation,
    lighter moves toward yellow and loses it."""
    r, g, b, _ = hexa(c); h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if k < 1:
        t = 1 - k; d = ((250 / 360 - h + .5) % 1) - .5; h = (h + d * t * .30) % 1; s = min(1, s + t * .30); v *= k
    else:
        t = k - 1; d = ((48 / 360 - h + .5) % 1) - .5; h = (h + d * t * .8) % 1; s = max(0, s - t * .6); v = min(1, v * k)
    r, g, b = colorsys.hsv_to_rgb(h, s, v); return '#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))

def lum(c): return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]

def pad(im, n=1):
    o = new(im.size[0] + 2 * n, im.size[1] + 2 * n); o.alpha_composite(im, (n, n)); return o

def selout(im, k=.45, color=None):
    """Outline: each pixel takes the darkened color of the fill it touches. `color` forces a single one."""
    w, h = im.size; src = im.load(); out = im.copy(); dst = out.load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] == 0:
                nb = [src[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                      if 0 <= x + dx < w and 0 <= y + dy < h and src[x + dx, y + dy][3] == 255]
                if nb: dst[x, y] = hexa(color) if color else hexa(hs(tohex(min(nb, key=lum)), k))
    return out

def fin(im, k=.45): return selout(pad(im), k)
def fin_navy(im): return selout(pad(im), color=NAVY)

def disc(im, cx, cy, r, c, a=255, ry=None):
    ry = ry or r
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        xs = [x for x in range(int(cx - r - 1), int(cx + r + 2)) if ((x + .5 - cx) / r) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1]
        if xs: P(im, xs[0], y, xs[-1] - xs[0] + 1, 1, c, a)

def shadow(w, h=4, a=62):
    """A flat, pill-shaped contact shadow."""
    im = new(w, h)
    for y in range(h):
        if h <= 3: inset = 1 if y in (0, h - 1) else 0
        else: inset = 2 if y in (0, h - 1) else (1 if y in (1, h - 2) else 0)
        P(im, inset, y, w - 2 * inset, 1, NAVY)
    px = im.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3]: px[x, y] = px[x, y][:3] + (a,)
    return im

def block_shadow(w, h, a=58):
    im = new(w, h); P(im, 1, 0, w - 1, h - 1, NAVY, a); P(im, 0, 1, w - 1, h - 1, NAVY, a); return im

class Scene:
    """A layered draw list. Inside a layer, sprites sort by their base line."""
    FLOOR, RUG, LIGHT, SHADOW, OBJ, TOP = range(6)
    def __init__(self, w, h): self.w, self.h, self.items = w, h, []
    def put(self, im, x, y, layer=None, base=None):
        layer = Scene.OBJ if layer is None else layer
        self.items.append((layer, (y + im.size[1]) if base is None else base, len(self.items), im, x, y))
    def render(self):
        sc = new(self.w, self.h)
        for layer, base, _, im, x, y in sorted(self.items, key=lambda t: t[:3]):
            l, t = max(0, -x), max(0, -y); r, b = min(im.size[0], self.w - x), min(im.size[1], self.h - y)
            if r > l and b > t: sc.alpha_composite(im.crop((l, t, r, b)), (max(0, x), max(0, y)))
        return sc
