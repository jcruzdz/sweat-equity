"""Facade sprites (front view, at night). Moonlight from the top left."""
from core import *

BODY, BODY_HI, BODY_LO, FRAME = '#2b3046', '#4b5374', '#1d2135', '#3b4262'
NG = ['#2f7a48', '#1d5236', '#153d2f', '#58a868']      # night greens: light, mid, dark, highlight
AMBER = ['#ffdc8f', '#ffd27a', '#fbc56d', '#f7ba63', '#f2b05c', '#eeaa58', '#eaa353', '#e69c4f', '#e2964b', '#de9047', '#d98a44', '#d48440', '#cf7e3d', '#ca783a', '#c47237', '#bd6c34']
SKIN = ['#f2c9a0', '#d9a47a', '#8d5a3b', '#f7d9bd']
HAIR = ['#3a2a1e', '#1f2238', '#b5651d', '#e0b04a', '#7a3b24']
SHIRT = ['#b9443f', '#3468b8', '#2f8f52', '#6a4fb0', '#c4567f', '#d98a2b', '#e9e4da']

def sky(w, h, seed=5):
    im = new(w, h); rnd = random.Random(seed)
    top, bot = hexa('#0c1034'), hexa('#232d6e')
    for y in range(h):
        t = y / (h - 1); band = round(t * 13) / 13
        P(im, 0, y, w, 1, tohex(tuple(round(top[i] + (bot[i] - top[i]) * band) for i in range(3))))
    for _ in range(90):
        x, y = rnd.randint(0, w - 1), rnd.randint(0, int(h * .62)); c = rnd.choice(['#ffffff', '#c9d6e0', '#94b0c2', '#94b0c2'])
        P(im, x, y, 1, 1, c, rnd.choice([255, 200, 140]))
        if rnd.random() < .08: P(im, x - 1, y, 3, 1, c, 120); P(im, x, y - 1, 1, 3, c, 120)
    return im

def moon():
    im = new(34, 34); disc(im, 17, 17, 17, '#f4e6b0', 12); disc(im, 17, 17, 13, '#f4e6b0', 24); disc(im, 17, 17, 9, '#f4e6b0'); disc(im, 15, 15, 6.5, '#fbf2cf')
    disc(im, 20, 20, 1.8, '#d9c98e'); disc(im, 14, 19, 1.2, '#d9c98e'); P(im, 18, 13, 2, 1, '#d9c98e'); return im

def cloud(w=46, seed=0):
    rnd = random.Random(seed); im = new(w, 12)
    for i in range(0, w - 8, 6): disc(im, i + 6, 7 + rnd.choice([0, 1]), rnd.choice([4, 5, 6]), '#2a3578', 150, ry=3.5)
    P(im, 3, 8, w - 6, 3, '#2a3578', 150); P(im, 6, 4, w - 16, 1, '#3a4690', 120)
    return im

def skyline(w, h, seed=2):
    rnd = random.Random(seed); im = new(w, h); x = 0
    while x < w:
        bw = rnd.randint(14, 30); bh = rnd.randint(int(h * .35), h); c = rnd.choice(['#161d4d', '#131942', '#1a2256'])
        P(im, x, h - bh, bw, bh, c); P(im, x, h - bh, bw, 1, hs(c, 1.25))
        if rnd.random() < .4: P(im, x + bw // 2, h - bh - 5, 1, 5, c); P(im, x + bw // 2, h - bh - 6, 1, 1, '#ff6b5e')
        for yy in range(h - bh + 3, h - 2, 4):
            for xx in range(x + 2, x + bw - 2, 3):
                if rnd.random() < .16: P(im, xx, yy, 1, 2, '#ffd27a', rnd.choice([150, 210]))
        x += bw + rnd.choice([0, 0, 2])
    return im

# ------------------------------------------------------------------ windows
def _seat(rnd, facing=1):
    """A person sitting in profile with desk and monitor, in an 18x15 tile that can be mirrored."""
    im = new(18, 15); base = 15
    hair, shirt, skin = rnd.choice(HAIR), rnd.choice(SHIRT), rnd.choice(SKIN)
    P(im, 6, base - 7, 11, 2, '#8a5a36'); P(im, 6, base - 7, 11, 1, '#a36d44'); P(im, 15, base - 5, 1, 5, '#6b4526')
    P(im, 11, base - 13, 5, 5, '#262b40'); P(im, 11, base - 12, 4, 3, '#bfeaff'); P(im, 13, base - 8, 1, 1, '#262b40')
    P(im, 0, base - 9, 1, 8, '#343b57'); P(im, 0, base - 3, 6, 1, '#343b57'); P(im, 3, base - 2, 1, 2, '#343b57')
    P(im, 1, base - 14, 4, 2, hair); P(im, 1, base - 12, 4, 3, skin); P(im, 1, base - 13, 1, 3, hair)
    P(im, 1, base - 9, 4, 5, shirt); P(im, 4, base - 8, 3, 1, shirt); P(im, 6, base - 8, 1, 1, skin)
    P(im, 2, base - 4, 4, 1, '#2f3350'); P(im, 5, base - 4, 1, 4, '#2f3350')
    return im if facing > 0 else im.transpose(Image.FLIP_LEFT_RIGHT)

def window_lit(seed=0, people=1, w=58, h=28):
    rnd = random.Random(seed); im = new(w, h)
    P(im, 0, 0, w, h, FRAME); P(im, 0, 0, w, 1, '#5d668c'); P(im, 0, h - 1, w, 1, '#262b40')
    ih = h - 4
    for i in range(ih): P(im, 2, 2 + i, w - 4, 1, AMBER[min(i * len(AMBER) // ih, len(AMBER) - 1)])
    base = h - 3
    P(im, 2, base - 3, w - 4, 4, '#a85f30'); P(im, 2, base - 3, w - 4, 1, '#bd7038')
    P(im, 2, 2, 1, ih, '#c47237', 110); P(im, w - 3, 2, 1, ih, '#c47237', 110)
    for x in range(8, w - 12, 16): P(im, x, 3, 9, 1, '#fff6d6'); P(im, x - 1, 4, 11, 1, '#ffe7a6', 150); P(im, x + 1, 5, 7, 1, '#ffe7a6', 70)
    k = max(1, min(people, (w - 6) // 19)); total = k * 18 + (k - 1)
    start = (w - total) // 2 if k > 1 else rnd.choice([6, w - 24, (w - 18) // 2])
    free_l, free_r = start - 3, w - 3 - (start + total)
    # back wall, behind the people
    kind = rnd.choice([0, 1, 2]); bx = 5 if free_l >= free_r else w - 19
    if kind == 0: P(im, bx, 7, 14, 6, '#e8b56b'); P(im, bx + 1, 8, 12, 4, '#fbe3b0'); P(im, bx + 2, 9, 2, 2, '#e2964b'); P(im, bx + 6, 9, 3, 2, '#d48440')
    if kind == 1: P(im, bx, 11, 12, 1, '#b3743b'); P(im, bx + 1, 8, 2, 3, '#c98443'); P(im, bx + 4, 7, 2, 4, '#a85f30'); P(im, bx + 7, 9, 3, 2, '#3f8a52')
    if kind == 2: P(im, bx + 2, 6, 8, 7, '#b3743b'); P(im, bx + 3, 7, 6, 5, '#fbe3b0'); P(im, bx + 4, 9, 4, 2, '#3f8a52')
    spots = []
    for n in range(k):
        facing = rnd.choice([1, 1, -1]); x0 = start + n * 19
        im.alpha_composite(_seat(rnd, facing), (x0, base - 15))
        # [screen x, screen y, hands x, hands y] inside the window, for the app to animate
        spots.append([x0 + (11 if facing > 0 else 3), base - 12, x0 + (6 if facing > 0 else 11), base - 8])
    im.info['spots'] = spots
    # a plant only where there is room left
    side = [s for s, free in (('l', free_l), ('r', free_r)) if free >= 7]
    if side:
        px = 4 if rnd.choice(side) == 'l' else w - 8
        P(im, px + 1, base - 13, 1, 6, '#2c6b45'); P(im, px, base - 12, 3, 2, '#3f8a52'); P(im, px - 1, base - 10, 5, 3, '#2c6b45'); P(im, px, base - 6, 3, 3, '#7a4a30')
    return im

def window_dark(seed=0, w=58, h=28):
    rnd = random.Random(seed); im = new(w, h)
    P(im, 0, 0, w, h, '#343b57'); P(im, 0, 0, w, 1, BODY_HI); P(im, 0, h - 1, w, 1, '#262b40')
    for i in range(h - 4): P(im, 2, 2 + i, w - 4, 1, hs('#14244a', 1 - i * .018))
    base = h - 3
    for x in range(10, w - 22, 20): P(im, x, base - 7, 12, 1, '#1d2f57'); P(im, x + 1, base - 6, 1, 5, '#1d2f57'); P(im, x + 10, base - 6, 1, 5, '#1d2f57'); P(im, x + 5, base - 12, 5, 4, '#1d2f57')
    P(im, w - 10, base - 10, 3, 9, '#1d2f57')
    for k in range(12): P(im, 6 + k, 3 + k, 4, 1, '#2a4273', 150); P(im, 15 + k, 3 + k, 1, 1, '#2a4273', 150)
    return im

def halo(w, h, c='#ffb347'):
    im = new(w + 8, h + 8); P(im, 0, 2, w + 8, h + 4, c, 12); P(im, 2, 0, w + 4, h + 8, c, 12); P(im, 1, 1, w + 6, h + 6, c, 14); P(im, 3, 3, w + 2, h + 2, c, 30); return im

# ------------------------------------------------------------------ building modules
FLOOR_H, SIGN_X, SIGN_W, BAY_X, BAY_GAP = 58, 118, 56, 94, 8
SLAB, SHIFT = 14, 12                           # the concrete slab on top of each floor carries the board; what used to start at 0 starts at SHIFT
BAY_W4, BAY_XS4 = 63, [11, 80, 149, 218]      # four contiguous windows under the slab
def bay_rects(w, n):
    """Position and width of each window on a floor. Four: contiguous, as in the approved design; else they share the width."""
    if n == 4 and w == 292: return [(x, BAY_W4) for x in BAY_XS4]
    usable = w - BAY_X - 10; bw = (usable - BAY_GAP * (n - 1)) // n
    return [(BAY_X + j * (bw + BAY_GAP), bw) for j in range(n)]

def facade_floor(w, bays, accent='#ff9b7a', seed=0, sign=True):
    """One floor. bays: a list with 0 (dark) or the number of people showing."""
    im = new(w, FLOOR_H)
    P(im, 0, 0, w, FLOOR_H, BODY)
    for x in range(8, w, 14): P(im, x, 4, 1, FLOOR_H - 7, '#272c41')
    P(im, 0, 0, w, 2, BODY_HI); P(im, 0, 0, w, 1, '#5d668c'); P(im, 0, 2, w, 2, BODY_LO); P(im, 0, FLOOR_H - 2, w, 2, BODY_LO)
    for x in (4, w - 6):
        P(im, x - 3, 6, 8, 34, accent, 18); P(im, x - 1, 7, 4, 32, accent, 34)
        P(im, x, 8, 2, 30, hs(accent, 1.25)); P(im, x, 8, 2, 2, '#fff3d6')
    if sign:
        P(im, SIGN_X, 7, SIGN_W, 31, FRAME); P(im, SIGN_X + 1, 8, SIGN_W - 2, 29, '#0f1328'); P(im, SIGN_X + 1, 8, SIGN_W - 2, 1, '#1a2040')
        P(im, SIGN_X, 38, SIGN_W, 1, accent, 110); P(im, SIGN_X + 2, 39, SIGN_W - 4, 1, accent, 40)
    for j, ((x, bw), n) in enumerate(zip(bay_rects(w, len(bays)), bays)):
        P(im, x - 4, 5, 1, 38, '#3f4763'); P(im, x - 3, 5, 1, 38, '#232840')
        if n:
            im.alpha_composite(halo(bw, 28), (x - 4, 2)); im.alpha_composite(window_lit(seed * 7 + j, n, bw), (x, 6)); P(im, x, 34, bw, 1, '#ffb347', 110)
        else:
            im.alpha_composite(window_dark(seed + j, bw), (x, 6))
        P(im, x, 36, bw, 7, '#161a2e'); P(im, x, 36, bw, 1, FRAME)
    return im

def roof(w, seed=0):
    im = new(w, 32)
    P(im, 26, 6, 54, 20, '#22263a'); P(im, 24, 4, 58, 3, FRAME); P(im, 24, 4, 58, 1, BODY_HI)                       # roof stair house
    P(im, 34, 13, 9, 13, '#161a2e'); P(im, 35, 14, 7, 12, '#ffd27a'); P(im, 38, 14, 1, 12, '#c47237'); P(im, 28, 10, 62, 18, '#ffb347', 14)
    for x in (52, 64): P(im, x, 12, 8, 6, '#343b57'); P(im, x + 1, 13, 6, 1, '#4b5374')
    for k in range(2):                                                                                               # solar panels
        x = w - 150 + k * 60
        P(im, x, 10, 52, 14, '#1c2c7a'); P(im, x, 10, 52, 1, '#6f8cf0'); P(im, x, 11, 52, 1, '#3f57c4')
        for c in range(1, 6): P(im, x + c * 9 - 1, 10, 1, 14, '#111b52')
        P(im, x, 17, 52, 1, '#111b52'); P(im, x + 4, 24, 2, 2, '#343b57'); P(im, x + 46, 24, 2, 2, '#343b57')
        for c in range(0, 6, 2): P(im, x + c * 9 + 2, 12, 3, 1, '#8aa5ff', 140)
    for x in (4, 92, 110, w - 22):                                                                                   # planters
        P(im, x, 21, 14, 5, '#5b4a3a'); P(im, x, 21, 14, 1, '#7a6650'); disc(im, x + 4, 17, 4.5, NG[1]); disc(im, x + 10, 18, 4, NG[2]); disc(im, x + 3, 15, 2.2, NG[0])
    P(im, w - 30, 0, 1, 26, '#4b5374'); P(im, w - 33, 6, 7, 1, '#4b5374'); P(im, w - 32, 10, 5, 1, '#4b5374'); P(im, w - 31, 0, 3, 2, '#ff6b5e')   # antenna
    P(im, 0, 26, w, 6, FRAME); P(im, 0, 26, w, 1, '#5d668c'); P(im, 0, 30, w, 2, BODY_LO)
    for x in range(0, w, 12): P(im, x, 22, 1, 4, '#5d668c', 170)
    P(im, 0, 22, w, 1, '#8aa5ff', 70)
    return im

def lobby(w):
    h = 52; im = new(w, h); P(im, 0, 0, w, h, BODY); P(im, 0, 0, w, 2, BODY_HI); P(im, 0, 0, w, 1, '#5d668c'); P(im, 0, 2, w, 2, BODY_LO)
    for x in (4, w - 6): P(im, x - 1, 8, 4, 38, '#ffd98a', 30); P(im, x, 9, 2, 36, '#ffe7a6')
    cx = w // 2
    for (x0, ww, kind) in ((14, cx - 14 - 34, 0), (cx + 34, w - 14 - (cx + 34), 1)):
        P(im, x0 - 3, 5, ww + 6, 44, '#ffb347', 16); P(im, x0, 8, ww, 40, FRAME); P(im, x0, 8, ww, 1, '#5d668c')
        ih = 36
        for i in range(ih): P(im, x0 + 2, 10 + i, ww - 4, 1, AMBER[min(i * 14 // ih, 13)])
        P(im, x0 + 2, 40, ww - 4, 6, '#a85f30'); P(im, x0 + 2, 40, ww - 4, 1, '#bd7038')
        for x in range(x0 + 8, x0 + ww - 12, 18): P(im, x, 11, 10, 1, '#fff6d6'); P(im, x - 1, 12, 12, 1, '#ffe7a6', 150)
        for x in range(x0 + ww // 3, x0 + ww - 2, ww // 3): P(im, x, 10, 1, 36, FRAME)
        if kind == 0:   # reception
            P(im, x0 + 10, 31, 34, 3, '#e9c98f'); P(im, x0 + 10, 34, 34, 8, '#8a5a36'); P(im, x0 + 12, 36, 30, 1, '#a36d44')
            P(im, x0 + 22, 22, 4, 2, HAIR[1]); P(im, x0 + 22, 24, 4, 3, SKIN[0]); P(im, x0 + 21, 27, 6, 4, SHIRT[1]); P(im, x0 + 32, 26, 6, 5, '#262b40'); P(im, x0 + 33, 27, 4, 3, '#bfeaff')
            P(im, x0 + 54, 20, 1, 12, '#2c6b45'); P(im, x0 + 52, 22, 5, 4, '#3f8a52'); P(im, x0 + 51, 26, 7, 5, '#2c6b45'); P(im, x0 + 52, 33, 5, 9, '#7a4a30')
            P(im, x0 + 66, 17, 14, 9, '#b3743b'); P(im, x0 + 67, 18, 12, 7, '#fbe3b0'); P(im, x0 + 69, 20, 4, 3, '#d48440')
        else:           # waiting area
            P(im, x0 + 10, 30, 30, 6, '#b9443f'); P(im, x0 + 10, 30, 30, 1, '#d9655f'); P(im, x0 + 8, 33, 34, 7, '#a13a36'); P(im, x0 + 10, 40, 2, 2, '#6b4526'); P(im, x0 + 38, 40, 2, 2, '#6b4526')
            P(im, x0 + 48, 35, 12, 2, '#8a5a36'); P(im, x0 + 53, 37, 2, 5, '#6b4526')
            P(im, x0 + 70, 18, 1, 14, '#2c6b45'); P(im, x0 + 68, 20, 5, 4, '#3f8a52'); P(im, x0 + 67, 24, 7, 6, '#2c6b45'); P(im, x0 + 68, 33, 5, 9, '#7a4a30')
            P(im, x0 + 22, 15, 16, 10, '#b3743b'); P(im, x0 + 23, 16, 14, 8, '#fbe3b0'); P(im, x0 + 25, 19, 10, 3, '#3f8a52')
    P(im, cx - 46, 0, 92, 5, FRAME); P(im, cx - 46, 0, 92, 1, '#5d668c'); P(im, cx - 48, 5, 96, 2, BODY_LO)                # canopy
    for x in (cx - 30, cx - 2, cx + 26): P(im, x, 7, 5, 1, '#fff6d6'); P(im, x - 2, 8, 9, 3, '#ffe7a6', 60)
    P(im, cx - 30, 8, 60, 44, FRAME); P(im, cx - 28, 10, 56, 42, '#f2b05c')
    for i in range(42): P(im, cx - 28, 10 + i, 56, 1, AMBER[min(i * 12 // 42, 11)])
    P(im, cx - 13, 14, 26, 38, FRAME); P(im, cx - 11, 16, 10, 36, '#f3cf8f'); P(im, cx + 1, 16, 10, 36, '#f3cf8f')
    P(im, cx - 11, 16, 10, 12, '#fbe3b0'); P(im, cx + 1, 16, 10, 12, '#fbe3b0'); P(im, cx - 9, 18, 2, 9, '#fff6e0'); P(im, cx + 3, 18, 2, 9, '#fff6e0')
    P(im, cx - 11, 40, 10, 12, '#e2b06a'); P(im, cx + 1, 40, 10, 12, '#e2b06a')
    P(im, cx - 3, 32, 1, 6, '#f4f4f8'); P(im, cx + 2, 32, 1, 6, '#f4f4f8'); P(im, cx - 28, 10, 56, 3, '#262b40')
    return im

def tree(seed=0):
    rnd = random.Random(seed); im = new(28, 42)
    P(im, 12, 24, 3, 18, '#4a3226'); P(im, 12, 24, 1, 18, '#6b4a33'); P(im, 15, 28, 2, 1, '#4a3226')
    for (cx, cy, r) in [(14, 10, 8), (8, 15, 6.5), (20, 16, 6.5), (14, 19, 7.5)]: disc(im, cx, cy, r, NG[1])
    for (cx, cy, r) in [(16, 22, 5), (21, 19, 4), (10, 21, 4)]: disc(im, cx, cy, r, NG[2])
    for (cx, cy, r) in [(11, 8, 4.8), (6, 13, 3.4), (17, 12, 3)]: disc(im, cx, cy, r, NG[0])
    for (cx, cy, r) in [(10, 6, 2.1), (5, 12, 1.4)]: disc(im, cx, cy, r, NG[3])
    for _ in range(12):
        x, y = rnd.randint(4, 23), rnd.randint(4, 23)
        if im.getpixel((x, y))[3]: P(im, x, y, 1, 1, NG[2])
    return selout(pad(im), .55)

def hedge(w=24, seed=0):
    rnd = random.Random(seed); im = new(w, 11)
    for i in range(0, w, 5): disc(im, i + 3, 5 + rnd.choice([0, 0, 1]), 3.8, NG[1])
    P(im, 0, 6, w, 5, NG[2])
    for i in range(1, w - 2, 4): P(im, i + rnd.choice([0, 1]), 2 + rnd.choice([0, 1]), 2, 1, NG[0])
    return selout(pad(im), .55)

def lamp_post():
    im = new(9, 40); P(im, 4, 6, 1, 32, '#3b4262'); P(im, 3, 38, 3, 2, '#3b4262'); P(im, 1, 3, 7, 3, '#4b5374'); P(im, 2, 5, 5, 2, '#fff3cf'); P(im, 3, 0, 3, 3, '#4b5374'); return im

def lamp_glow():
    im = new(48, 60); disc(im, 24, 10, 22, '#ffd98a', 10, ry=9); disc(im, 24, 10, 13, '#ffd98a', 22, ry=6); disc(im, 24, 48, 22, '#ffd98a', 16, ry=8); disc(im, 24, 48, 13, '#ffd98a', 22, ry=5); return im

def bench_out():
    im = new(26, 12); P(im, 0, 0, 26, 2, '#7a5a3c'); P(im, 0, 3, 26, 2, '#6b4a33'); P(im, 0, 6, 26, 2, '#8a6a47'); P(im, 2, 8, 2, 4, '#343b57'); P(im, 22, 8, 2, 4, '#343b57'); return selout(pad(im), .55)

def ground(w, h, seed=3):
    rnd = random.Random(seed); im = new(w, h); P(im, 0, 0, w, h, '#1b4f30'); P(im, 0, 0, w, 1, NG[0]); P(im, 0, 1, w, 1, '#236238')
    for _ in range(w // 3): P(im, rnd.randint(0, w - 2), rnd.randint(3, h - 2), rnd.choice([1, 2]), 1, rnd.choice(['#236238', '#17452a', '#2a7040']))
    return im

def path(w, h):
    im = new(w, h)
    for y in range(h):
        grow = y // 3; P(im, 6 - min(6, grow), y, w - 12 + 2 * min(6, grow), 1, '#6d7699' if y % 4 else '#565e80')
    for x in range(8, w - 6, 9): P(im, x, 1, 1, h - 1, '#565e80')
    P(im, 6, 0, w - 12, 1, '#8a93b5')
    return im

def beacon():
    """The alert above a window when an agent is waiting for an answer."""
    c = '#ffb020'; im = new(9, 10); P(im, 1, 0, 7, 8, c); P(im, 0, 1, 9, 6, c); P(im, 3, 8, 3, 1, c); P(im, 4, 9, 1, 1, c); P(im, 1, 1, 5, 1, '#ffd27a'); P(im, 4, 2, 1, 3, NAVY); P(im, 4, 6, 1, 1, NAVY)
    return fin_navy(im)

def beacon_work():
    """The badge on a window while agents are working on it: blue, three dots."""
    c = '#41a6f6'; im = new(9, 10); P(im, 1, 0, 7, 8, c); P(im, 0, 1, 9, 6, c); P(im, 3, 8, 3, 1, c); P(im, 4, 9, 1, 1, c); P(im, 1, 1, 5, 1, '#a9d6fb')
    for x in (2, 4, 6): P(im, x, 4, 1, 1, NAVY)
    return fin_navy(im)

def beacon_done():
    """The flag above a window when an agent finished and nobody has looked yet."""
    c = '#3ecf8e'; im = new(9, 10); P(im, 1, 0, 7, 8, c); P(im, 0, 1, 9, 6, c); P(im, 3, 8, 3, 1, c); P(im, 4, 9, 1, 1, c); P(im, 1, 1, 5, 1, '#a6f0cb')
    for x, y in ((2, 4), (3, 5), (4, 4), (5, 3), (6, 2)): P(im, x, y, 1, 2, NAVY)
    return fin_navy(im)
