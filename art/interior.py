"""Office interior sprites (three-quarter view from above).
Amber is reserved for "needs you": no furniture or clothing uses it."""
from core import *

SKINS = ['#f2c9a0', '#d9a47a', '#8d5a3b', '#f7d9bd', '#b9774f']
HAIRS = ['#3b3552', '#8a4b2a', '#e6d3a3', '#b5651d', '#5a3a2a', '#c2c5d6', '#d1583f']
SHIRTS = ['#d9534f', '#3b7dd8', '#7a5cc7', '#3fa35a', '#e56b9a', '#5b6ee1', '#2aa5a0', '#f4f1ea']
DARK = '#3d4463'
ALERT = '#ffb020'

# ------------------------------------------------------------------ people
def _head_front(im, ox, o, hair, skin, style, accent):
    """A head from the front, 10 wide. style: 0 short, 1 long, 2 bob, 3 bun, 4 cap, 5 headphones."""
    P(im, ox + 3, o, 8, 1, hair); P(im, ox + 2, o + 1, 10, 4, hair)
    P(im, ox + 2, o + 5, 1, 3, hair); P(im, ox + 11, o + 5, 1, 3, hs(hair, .78))
    P(im, ox + 3, o + 4, 8, 5, skin); P(im, ox + 10, o + 5, 1, 4, hs(skin, .9)); P(im, ox + 4, o + 9, 6, 1, hs(skin, .85))
    P(im, ox + 3, o + 4, 3, 1, hair); P(im, ox + 9, o + 4, 2, 1, hs(hair, .78))
    P(im, ox + 4, o + 1, 4, 1, hs(hair, 1.35)); P(im, ox + 3, o + 2, 2, 1, hs(hair, 1.35)); P(im, ox + 9, o + 1, 3, 3, hs(hair, .78))
    P(im, ox + 4, o + 6, 1, 2, NAVY); P(im, ox + 9, o + 6, 1, 2, NAVY)
    P(im, ox + 3, o + 8, 1, 1, '#f09a8a'); P(im, ox + 10, o + 8, 1, 1, '#e58a7c')
    if style == 1: P(im, ox + 2, o + 5, 1, 7, hair); P(im, ox + 11, o + 5, 1, 7, hs(hair, .78)); P(im, ox + 1, o + 8, 1, 4, hair); P(im, ox + 12, o + 8, 1, 4, hs(hair, .78))
    if style == 2: P(im, ox + 1, o + 2, 1, 6, hair); P(im, ox + 12, o + 2, 1, 6, hs(hair, .78)); P(im, ox + 2, o + 8, 1, 1, hair); P(im, ox + 11, o + 8, 1, 1, hs(hair, .78))
    if style == 3: P(im, ox + 5, o - 2, 4, 2, hair); P(im, ox + 5, o - 2, 2, 1, hs(hair, 1.35)); P(im, ox + 8, o - 1, 1, 1, hs(hair, .78))
    if style == 4:
        P(im, ox + 3, o, 8, 1, accent); P(im, ox + 2, o + 1, 10, 2, accent); P(im, ox + 3, o + 1, 4, 1, hs(accent, 1.25)); P(im, ox + 9, o + 1, 3, 2, hs(accent, .8))
        P(im, ox + 2, o + 3, 10, 1, hs(accent, .72)); P(im, ox + 3, o + 4, 8, 1, skin)
    if style == 5:
        P(im, ox + 3, o - 1, 8, 1, DARK); P(im, ox + 2, o, 1, 2, DARK); P(im, ox + 11, o, 1, 2, DARK)
        P(im, ox + 1, o + 4, 2, 4, DARK); P(im, ox + 11, o + 4, 2, 4, DARK); P(im, ox + 1, o + 4, 1, 1, hs(DARK, 1.4)); P(im, ox + 11, o + 4, 1, 1, hs(DARK, 1.4))

def _torso_front(im, ox, o, shirt, skin):
    P(im, ox + 3, o + 10, 8, 6, shirt); P(im, ox + 1, o + 10, 2, 5, shirt); P(im, ox + 11, o + 10, 2, 5, hs(shirt, .85))
    P(im, ox + 3, o + 10, 8, 1, hs(shirt, 1.18)); P(im, ox + 1, o + 10, 2, 1, hs(shirt, 1.18)); P(im, ox + 6, o + 10, 2, 1, hs(skin, .88))
    P(im, ox + 9, o + 11, 2, 4, hs(shirt, .88)); P(im, ox + 3, o + 15, 8, 1, hs(shirt, .75))
    P(im, ox + 1, o + 15, 2, 1, skin); P(im, ox + 11, o + 15, 2, 1, hs(skin, .9))

def person_front(hair, shirt, pants='#3b4262', skin='#f2c9a0', style=0, accent='#e2532f', mug=None):
    """Standing, facing us."""
    im = new(14, 22); o = 2
    _head_front(im, 0, o, hair, skin, style, accent); _torso_front(im, 0, o, shirt, skin)
    P(im, 3, o + 16, 3, 3, pants); P(im, 8, o + 16, 3, 3, hs(pants, .85)); P(im, 3, o + 16, 3, 1, hs(pants, 1.2))
    P(im, 3, o + 19, 3, 1, NAVY); P(im, 8, o + 19, 3, 1, NAVY)
    if mug:
        P(im, 10, o + 12, 3, 3, mug); P(im, 10, o + 12, 3, 1, hs(mug, 1.25)); P(im, 13, o + 13, 1, 1, mug); P(im, 11, o + 15, 2, 1, skin)
    return fin(im)

def sofa_sitter(hair, shirt, pants='#3b4262', skin='#f2c9a0', style=0, accent='#e2532f'):
    """Sitting on a sofa, facing us: foreshortened thighs, knees and feet."""
    im = new(14, 22); o = 2
    _head_front(im, 0, o, hair, skin, style, accent); _torso_front(im, 0, o, shirt, skin)
    P(im, 2, o + 16, 10, 2, pants); P(im, 2, o + 16, 10, 1, hs(pants, 1.25)); P(im, 7, o + 16, 1, 2, hs(pants, .8))
    P(im, 2, o + 18, 4, 1, hs(pants, .85)); P(im, 8, o + 18, 4, 1, hs(pants, .8))
    P(im, 2, o + 19, 4, 1, NAVY); P(im, 8, o + 19, 4, 1, NAVY)
    return fin(im)

def sitter_front(hair, shirt, skin='#f2c9a0', style=0, accent='#e2532f'):
    """Sitting behind their desk, facing us: head and shoulders. The desk hides the rest."""
    im = new(16, 17); o = 2
    _head_front(im, 1, o, hair, skin, style, accent)
    P(im, 2, o + 10, 12, 5, shirt); P(im, 2, o + 10, 12, 1, hs(shirt, 1.18)); P(im, 7, o + 10, 2, 1, hs(skin, .88)); P(im, 11, o + 11, 3, 4, hs(shirt, .86))
    P(im, 0, o + 11, 2, 4, shirt); P(im, 14, o + 11, 2, 4, hs(shirt, .8)); P(im, 0, o + 11, 2, 1, hs(shirt, 1.18))
    return fin(im)

def sitter_back(hair, shirt, skin='#f2c9a0', style=0, accent='#e2532f'):
    """Sitting with their back to us, forearms on the desk. The chair is a separate sprite."""
    im = new(16, 17); o = 1
    P(im, 4, o, 8, 1, hair); P(im, 3, o + 1, 10, 7, hair); P(im, 4, o + 8, 8, 1, hair)
    P(im, 4, o + 1, 4, 1, hs(hair, 1.4)); P(im, 4, o + 2, 2, 2, hs(hair, 1.4)); P(im, 6, o + 2, 1, 1, hs(hair, 1.4))
    P(im, 10, o + 5, 3, 3, hs(hair, .72)); P(im, 5, o + 8, 6, 1, hs(hair, .72)); P(im, 9, o + 7, 2, 1, hs(hair, .72))
    if style == 1: P(im, 6, o + 9, 4, 3, hair); P(im, 8, o + 9, 2, 3, hs(hair, .72)); P(im, 7, o + 12, 2, 1, hs(hair, .72))
    if style == 2: P(im, 2, o + 3, 1, 5, hair); P(im, 13, o + 3, 1, 5, hs(hair, .72)); P(im, 3, o + 8, 1, 1, hair); P(im, 12, o + 8, 1, 1, hs(hair, .72))
    if style == 3: P(im, 6, o - 1, 4, 2, hair); P(im, 6, o - 1, 2, 1, hs(hair, 1.4)); P(im, 9, o, 1, 1, hs(hair, .72))
    if style == 4:
        P(im, 4, o, 8, 1, accent); P(im, 3, o + 1, 10, 4, accent); P(im, 4, o + 1, 4, 1, hs(accent, 1.25)); P(im, 10, o + 2, 3, 3, hs(accent, .78))
        P(im, 7, o + 4, 2, 1, hair); P(im, 6, o + 5, 4, 1, hs(accent, .7))
    if style == 5:
        P(im, 4, o - 1, 8, 1, DARK); P(im, 3, o, 1, 2, DARK); P(im, 12, o, 1, 2, DARK)
        P(im, 2, o + 2, 2, 5, DARK); P(im, 12, o + 2, 2, 5, DARK); P(im, 2, o + 2, 1, 2, hs(DARK, 1.4)); P(im, 12, o + 2, 1, 1, hs(DARK, 1.4))
    if style != 1: P(im, 6, o + 9, 4, 1, hs(skin, .82))
    P(im, 2, o + 10, 12, 5, shirt); P(im, 2, o + 10, 12, 1, hs(shirt, 1.18)); P(im, 2, o + 14, 12, 1, hs(shirt, .78)); P(im, 11, o + 11, 3, 3, hs(shirt, .88))
    P(im, 0, o + 7, 2, 5, hs(shirt, .92)); P(im, 14, o + 7, 2, 5, hs(shirt, .78)); P(im, 0, o + 7, 2, 1, hs(shirt, 1.18))
    P(im, 0, o + 5, 2, 2, skin); P(im, 14, o + 5, 2, 2, hs(skin, .9))
    return fin(im)

def chair(c='#4f5885'):
    im = new(12, 13)
    P(im, 1, 0, 10, 1, hs(c, 1.2)); P(im, 0, 1, 12, 6, c); P(im, 1, 2, 10, 1, hs(c, 1.2)); P(im, 1, 6, 10, 1, hs(c, .8))
    P(im, 0, 3, 1, 4, hs(c, .8)); P(im, 11, 3, 1, 4, hs(c, .8))
    P(im, 5, 7, 2, 3, '#3a3f5c'); P(im, 2, 10, 8, 1, '#3a3f5c'); P(im, 1, 11, 2, 1, '#2f3350'); P(im, 9, 11, 2, 1, '#2f3350'); P(im, 5, 11, 2, 2, '#2f3350')
    return fin(im)

# ------------------------------------------------------------------ workstation
DESK_TOP, DESK_FRONT = '#f1d9b0', '#cfa26d'
def desk(w=34):
    im = new(w, 16)
    P(im, 0, 0, w, 9, DESK_TOP); P(im, 0, 0, w, 1, hs(DESK_TOP, 1.1)); P(im, 0, 8, w, 1, hs(DESK_TOP, .88))
    P(im, 0, 9, w, 3, DESK_FRONT); P(im, 0, 11, w, 1, hs(DESK_FRONT, .85)); P(im, w // 2, 9, 1, 3, hs(DESK_FRONT, .9))
    P(im, 1, 12, 2, 4, hs(DESK_FRONT, .78)); P(im, w - 3, 12, 2, 4, hs(DESK_FRONT, .78))
    return fin(im)

def desk_shadow(w=34):
    im = new(w + 2, 9); P(im, 3, 0, w - 2, 7, NAVY, 56); P(im, 2, 7, w, 2, NAVY, 56); return im

STATE_LIGHT = {'work': '#6aa9ff', 'wait': ALERT, 'done': '#3ecf8e', 'idle': None}
def monitor(kind='work', seed=0):
    """The screen tells the status: work = code, wait = amber cursor, done = tick, idle = off."""
    bez = DARK; im = new(17, 13); rnd = random.Random(seed)
    P(im, 0, 0, 17, 10, bez); P(im, 0, 0, 17, 1, hs(bez, 1.3)); P(im, 16, 1, 1, 9, hs(bez, .8))
    scr = {'work': '#1f2a44', 'wait': '#2a2238', 'done': '#2fae6e', 'idle': '#1b1e2e'}[kind]
    P(im, 1, 1, 15, 8, scr)
    if kind == 'work':
        cols = ['#7ee0ff', '#b8f08a', '#c9b8ff', '#ff9bb3']
        for row in range(7):
            ind = rnd.choice([0, 1, 1, 2]); ln = rnd.randint(3, 11 - ind)
            if rnd.random() < .85: P(im, 2 + ind, 2 + row, ln, 1, rnd.choice(cols), 255 if row % 2 == 0 else 190)
    if kind == 'wait':
        P(im, 2, 2, 6, 1, '#8088a6'); P(im, 2, 4, 9, 1, '#8088a6'); P(im, 2, 6, 2, 1, ALERT); P(im, 5, 6, 3, 2, ALERT)
    if kind == 'done':
        P(im, 1, 1, 15, 1, '#5fd08f')
        for (x, y) in [(4, 5), (5, 6), (6, 7), (7, 6), (8, 5), (9, 4), (10, 3)]: P(im, x, y, 2, 1, '#ffffff')
    if kind == 'idle': P(im, 12, 2, 2, 1, '#343a57'); P(im, 14, 9, 1, 1, '#e2532f')
    P(im, 7, 10, 3, 2, hs(bez, .7)); P(im, 5, 12, 7, 1, hs(bez, .7))
    return fin(im)

def monitor_back(kind='work'):
    """A monitor seen from behind (the one of the agent facing us). Light casing and a light strip with its status."""
    bez = '#9aa3bd'; im = new(17, 13)
    P(im, 0, 0, 17, 10, bez); P(im, 0, 0, 17, 1, hs(bez, 1.2)); P(im, 16, 1, 1, 9, hs(bez, .82)); P(im, 1, 8, 15, 1, hs(bez, .88)); P(im, 0, 9, 17, 1, hs(bez, .78))
    P(im, 7, 5, 3, 2, hs(bez, .8)); P(im, 3, 4, 3, 1, hs(bez, .88)); P(im, 11, 4, 3, 1, hs(bez, .88))
    P(im, 4, 2, 9, 1, STATE_LIGHT[kind] or hs(bez, .8))
    if STATE_LIGHT[kind]: P(im, 5, 2, 2, 1, '#ffffff', 120)
    P(im, 7, 10, 3, 2, hs(DARK, .7)); P(im, 5, 12, 7, 1, hs(DARK, .7))
    return fin(im)

def keyboard():
    im = new(10, 3); P(im, 0, 0, 10, 3, '#d9dce8'); P(im, 0, 2, 10, 1, '#aab0c6')
    for x in (1, 3, 5, 7): P(im, x, 0, 1, 1, '#f4f4f8'); P(im, x + 1, 1, 1, 1, '#f4f4f8')
    return im
def mouse(): im = new(2, 3); P(im, 0, 0, 2, 3, '#d9dce8'); P(im, 0, 2, 2, 1, '#aab0c6'); return im
def mug(c='#e2532f'): im = new(4, 3); P(im, 0, 0, 3, 3, c); P(im, 1, 0, 1, 1, '#5b3a29'); P(im, 3, 1, 1, 1, c); return fin(im, .5)
def paper(): im = new(5, 4); P(im, 0, 0, 5, 4, '#fbfaf5'); P(im, 1, 1, 3, 1, '#b9bfd2'); P(im, 1, 2, 2, 1, '#b9bfd2'); return im
def notes():
    im = new(6, 5); P(im, 0, 1, 3, 3, '#b8f08a'); P(im, 3, 0, 3, 3, '#ff9bb3'); P(im, 2, 2, 3, 3, '#9be3ff'); return im
def desk_lamp():
    im = new(5, 6); P(im, 0, 0, 5, 2, '#7ac7c4'); P(im, 0, 0, 5, 1, '#a5e0dc'); P(im, 2, 2, 1, 3, DARK); P(im, 1, 5, 3, 1, DARK); return fin(im, .5)
def succulent():
    im = new(5, 6); P(im, 2, 0, 1, 3, '#74d06f'); P(im, 0, 1, 2, 2, '#3fa35a'); P(im, 3, 1, 2, 2, '#2a7a55'); P(im, 1, 3, 3, 3, '#c9764a'); P(im, 3, 3, 1, 3, hs('#c9764a', .8)); return fin(im, .5)
def robot():
    im = new(5, 6); P(im, 1, 0, 3, 3, '#d9534f'); P(im, 1, 1, 1, 1, '#ffffff'); P(im, 3, 1, 1, 1, '#ffffff'); P(im, 0, 3, 5, 2, '#b9443f'); P(im, 1, 5, 1, 1, DARK); P(im, 3, 5, 1, 1, DARK); return fin(im, .5)
def books():
    im = new(7, 4); P(im, 0, 2, 7, 2, '#3b7dd8'); P(im, 1, 0, 6, 2, '#d9534f'); P(im, 0, 3, 7, 1, hs('#3b7dd8', .8)); P(im, 2, 1, 4, 1, '#f4f1ea'); return fin(im, .5)
def headphones():
    im = new(6, 4); P(im, 1, 0, 4, 1, DARK); P(im, 0, 1, 2, 3, DARK); P(im, 4, 1, 2, 3, DARK); P(im, 0, 1, 1, 1, hs(DARK, 1.4)); return im
def photo():
    im = new(5, 5); P(im, 0, 0, 5, 5, '#8a5a3c'); P(im, 1, 1, 3, 3, '#bfe3ee'); P(im, 1, 3, 3, 1, '#6fcf73'); return im

DESK_PROPS = [lambda r: mug(r.choice(['#e2532f', '#3b7dd8', '#7a5cc7', '#f4f1ea', '#2aa5a0'])), paper, notes, desk_lamp, succulent, robot, books, headphones, photo]

# ------------------------------------------------------------------ status
def bubble_wait():
    c = ALERT; im = new(13, 14)
    P(im, 2, 0, 9, 11, c); P(im, 0, 2, 13, 7, c); P(im, 1, 1, 11, 9, c); P(im, 5, 11, 3, 1, c); P(im, 6, 12, 1, 1, c)
    P(im, 2, 1, 8, 1, '#ffd27a'); P(im, 1, 2, 1, 5, '#ffd27a'); P(im, 10, 8, 2, 1, hs(c, .85)); P(im, 9, 9, 2, 1, hs(c, .85))
    P(im, 6, 2, 2, 5, NAVY); P(im, 6, 8, 2, 2, NAVY)
    return fin_navy(im)

def bubble_done():
    """Over an agent that finished while nobody was looking."""
    c = '#3ecf8e'; im = new(13, 14)
    P(im, 2, 0, 9, 11, c); P(im, 0, 2, 13, 7, c); P(im, 1, 1, 11, 9, c); P(im, 5, 11, 3, 1, c); P(im, 6, 12, 1, 1, c)
    P(im, 2, 1, 8, 1, '#a6f0cb'); P(im, 1, 2, 1, 5, '#a6f0cb'); P(im, 10, 8, 2, 1, hs(c, .85)); P(im, 9, 9, 2, 1, hs(c, .85))
    for x, y in ((3, 5), (4, 6), (5, 7), (6, 6), (7, 5), (8, 4), (9, 3)): P(im, x, y, 1, 2, NAVY)
    return fin_navy(im)

def ring(w=22, h=7, c=ALERT, a=230):
    im = new(w, h)
    for y in range(h): inset = [4, 2, 0, 0, 0, 2, 4][y]; P(im, inset, y, w - 2 * inset, 1, c)
    px = im.load()
    for y in range(1, h - 1):
        inset = [0, 5, 3, 2, 3, 5, 0][y]
        for x in range(inset, w - inset): px[x, y] = (0, 0, 0, 0)
    for y in range(h):
        for x in range(w):
            if px[x, y][3]: px[x, y] = px[x, y][:3] + (a,)
    return im

def zzz():
    im = new(13, 12)
    big = ["#######", ".....#.", "....#..", "...#...", "..#....", ".#.....", "#######"]
    small = ["####", "..#.", ".#..", "####"]
    for (ox, oy, rows) in ((0, 5, big), (9, 0, small)):
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '#': P(im, ox + x, oy + y, 1, 1, '#ffffff')
    return fin_navy(im)

def sparkle(c='#eafff2'):
    im = new(5, 5); P(im, 2, 0, 1, 5, c); P(im, 0, 2, 5, 1, c); P(im, 2, 2, 1, 1, '#ffffff'); return im

# ------------------------------------------------------------------ walls and wall objects
CAP, CAPHI, FACE, FACESH, BASEB = '#444c6b', '#5d668c', '#f1e6d6', '#ddd0c4', '#b7a9a6'
FACE_H = 26
def wall_h(w, shadow_below=True):
    """A horizontal wall: a 4-px cap and its south face, with a shadow on the floor."""
    im = new(w, 4 + FACE_H + 3)
    P(im, 0, 0, w, 4, CAP); P(im, 0, 0, w, 1, CAPHI); P(im, 0, 3, w, 1, hs(CAP, .85))
    P(im, 0, 4, w, FACE_H, FACE); P(im, 0, 4, w, 2, FACESH); P(im, 0, 6, w, 1, hs(FACE, .97))
    P(im, 0, 4 + FACE_H - 3, w, 3, BASEB); P(im, 0, 4 + FACE_H - 3, w, 1, hs(BASEB, 1.12))
    if shadow_below: P(im, 0, 4 + FACE_H, w, 2, NAVY, 46); P(im, 0, 6 + FACE_H, w, 1, NAVY, 20)
    return im

def wall_v(h):
    """A vertical wall: only the cap shows; shadow to its right."""
    im = new(6, h); P(im, 0, 0, 4, h, CAP); P(im, 0, 0, 1, h, CAPHI); P(im, 3, 0, 1, h, hs(CAP, .85)); P(im, 4, 0, 2, h, NAVY, 40); return im

def wall_end():
    """The end of a horizontal wall that stops: the edge of its face."""
    im = new(4, 4 + FACE_H); P(im, 0, 0, 4, 4, CAP); P(im, 0, 0, 4, 1, CAPHI); P(im, 0, 4, 4, FACE_H, hs(FACE, .9)); P(im, 0, 4 + FACE_H - 3, 4, 3, hs(BASEB, .92)); return im

def cap_h(w):
    im = new(w, 4); P(im, 0, 0, w, 4, CAP); P(im, 0, 0, w, 1, CAPHI); P(im, 0, 3, w, 1, hs(CAP, .85)); return im

def door(open_side='right'):
    """A doorway with a wooden frame and an open leaf. As tall as the wall face plus the threshold."""
    h = FACE_H + 2; im = new(24, h)
    P(im, 0, 0, 24, h, '#b98a57'); P(im, 0, 0, 24, 1, hs('#b98a57', 1.2)); P(im, 22, 1, 2, h - 1, hs('#b98a57', .82))
    P(im, 2, 2, 20, h - 2, '#d9c4a2'); P(im, 2, 2, 20, 6, '#a8927a'); P(im, 2, 8, 20, 3, '#bfa98a'); P(im, 2, 11, 20, 2, '#cdb896')
    x = 15 if open_side == 'right' else 2
    P(im, x, 3, 7, h - 3, '#a7663f'); P(im, x, 3, 7, 1, '#c98a5a'); P(im, x if open_side == 'right' else x + 6, 3, 1, h - 3, '#8a4f2e')
    P(im, x + 2, 6, 3, 8, hs('#a7663f', .9)); P(im, x + 2, 17, 3, 8, hs('#a7663f', .9))
    P(im, x + (1 if open_side == 'right' else 5), 15, 1, 2, '#d9dce8')
    return im

WB_W, WB_H = 52, 20
def whiteboard(w=WB_W, h=WB_H):
    """A whiteboard with a title strip and four columns. The app draws the title and the cards."""
    im = new(w, h)
    P(im, 0, 0, w, h - 2, '#a7aec6'); P(im, 1, 1, w - 2, h - 4, '#fbfaf5')
    P(im, 1, 1, w - 2, 5, '#e3e7f2'); P(im, 1, 5, w - 2, 1, '#cfd5e6')
    for k in range(1, 4): P(im, 1 + k * (w - 2) // 4, 6, 1, h - 9, '#e4e2dc')
    P(im, 1, h - 4, w - 2, 1, '#e4e2dc')
    P(im, 0, h - 2, w, 2, '#8088a6'); P(im, 3, h - 2, 5, 1, '#e2532f'); P(im, 10, h - 2, 4, 1, '#3b7dd8'); P(im, w - 8, h - 2, 5, 1, '#f4f1ea')
    return fin(im)

def kanban_cards(counts, current, w=WB_W, h=WB_H):
    """What the app draws on the whiteboard: the current column tinted and one dark card per subtask."""
    im = new(w, h); cw = (w - 2) // 4
    for c, n in enumerate(counts):
        x0 = 1 + c * cw
        if c == current: P(im, x0 + 1, 6, cw - 1, h - 10, '#cfe0ff')
        for k in range(min(n, 9)):
            P(im, x0 + 2 + (k % 3) * 4, 8 + (k // 3) * 3, 3, 2, DARK)
    return im

def picture(kind=0):
    im = new(10, 9); P(im, 0, 0, 10, 9, '#8a5a3c'); P(im, 0, 0, 10, 1, '#a9744e')
    if kind == 0: P(im, 1, 1, 8, 7, '#bfe3ee'); P(im, 1, 5, 8, 3, '#6fcf73'); P(im, 5, 2, 2, 2, '#fbf2cf'); P(im, 2, 4, 3, 1, '#58a868')
    if kind == 1: P(im, 1, 1, 8, 7, '#f4f1ea'); P(im, 2, 2, 3, 3, '#e2532f'); P(im, 5, 4, 3, 3, '#3b7dd8'); P(im, 3, 5, 2, 2, '#2aa5a0')
    if kind == 2: P(im, 1, 1, 8, 7, '#2a3a6b'); P(im, 2, 5, 6, 2, '#1d2748'); P(im, 6, 2, 2, 2, '#f4f1ea'); P(im, 3, 3, 1, 1, '#ffffff')
    return fin(im)

def clock():
    im = new(9, 9); disc(im, 4.5, 4.5, 4.5, '#3d4463'); disc(im, 4.5, 4.5, 3.5, '#fbfaf5'); P(im, 4, 2, 1, 3, NAVY); P(im, 4, 4, 3, 1, '#e2532f'); return im

def wall_window(w=26, h=14, night=True, seed=0):
    im = new(w, h); rnd = random.Random(seed)
    P(im, 0, 0, w, h, '#cfc3b6'); P(im, 0, 0, w, 1, '#e3d8cb')
    if night:
        for i in range(h - 2): P(im, 1, 1 + i, w - 2, 1, hs('#1c2a5e', 1 - i * .035))
        for _ in range(5): P(im, rnd.randint(2, w - 3), rnd.randint(2, h - 6), 1, 1, '#dfe6ff')
        P(im, 1, h - 5, w - 2, 4, '#141d42')
        for x in range(2, w - 3, 5): P(im, x, h - 6 - rnd.choice([0, 1, 2]), 3, 6, '#101736'); P(im, x + 1, h - 5, 1, 1, '#cfe0ff')
    else:
        P(im, 1, 1, w - 2, h - 2, '#a9d8ee'); P(im, 1, 1, w - 2, 4, '#c9ecf9')
        for k in range(5): P(im, 3 + k, 8 - k, 2, 1, '#e6f7fd')
    P(im, w // 2, 1, 1, h - 2, '#cfc3b6'); P(im, 0, h - 1, w, 1, '#b7a9a6')
    return fin(im, .6)

def notice_board():
    im = new(26, 14); P(im, 0, 0, 26, 14, '#8a5a3c'); P(im, 1, 1, 24, 12, '#c9a57c'); P(im, 1, 1, 24, 1, '#d6b48d')
    for (x, y, w, h, c) in [(3, 3, 5, 4, '#fbfaf5'), (10, 2, 4, 4, '#b8f08a'), (16, 3, 6, 5, '#fbfaf5'), (4, 8, 4, 3, '#9be3ff'), (10, 7, 5, 4, '#ff9bb3'), (17, 9, 4, 3, '#c9b8ff')]:
        P(im, x, y, w, h, c); P(im, x + w // 2, y, 1, 1, '#e2532f')
    return fin(im)

def plaque(w=40):
    """The dark plaque next to a door; the app draws the text."""
    im = new(w, 8); P(im, 0, 0, w, 8, '#23263a'); P(im, 0, 0, w, 1, '#3d4463'); return im

# ------------------------------------------------------------------ plants
G = ['#74d06f', '#3fa35a', '#2a7a55']
def _pot(im, x, y, c):
    P(im, x, y, 7, 2, c); P(im, x + 1, y + 2, 5, 3, c); P(im, x + 5, y, 2, 5, hs(c, .85)); P(im, x + 1, y + 4, 5, 1, hs(c, .78)); P(im, x, y, 7, 1, hs(c, 1.08))

def plant(kind=0, seed=0, pot='#f4f4f8'):
    rnd = random.Random(seed)
    if kind == 0:   # fern
        im = new(17, 22)
        def leaf(x, y, dx, dy, n):
            for k in range(n):
                xx, yy = x + dx * k, y + round(dy * k); wdt = 2 if 0 < k < n - 1 else 1
                P(im, xx, yy, 1, wdt + 1, G[1]); P(im, xx, yy, 1, 1, G[0])
                if k > 1: P(im, xx, yy + wdt, 1, 1, G[2])
        P(im, 8, 6, 1, 10, G[2])
        leaf(8, 12, -1, -.2, 7); leaf(8, 12, 1, -.2, 7); leaf(8, 9, -1, -.7, 7); leaf(8, 9, 1, -.7, 7); leaf(8, 6, -1, -1.2, 5); leaf(8, 6, 1, -1.2, 5)
        P(im, 8, 0, 1, 7, G[1]); P(im, 7, 2, 1, 4, G[0]); P(im, 9, 2, 1, 4, G[2])
        _pot(im, 5, 16, pot); return fin(im)
    if kind == 1:   # snake plant
        im = new(13, 23)
        for (x, hgt, back) in [(2, 8, True), (6, 12, True), (10, 7, True), (0, 11, False), (4, 16, False), (8, 14, False), (11, 10, False)]:
            hgt += rnd.choice([-1, 0, 1]); top = 18 - hgt; c = G[2] if back else G[1]
            P(im, x, top, 2, hgt, c); P(im, x, top + 1, 1, hgt - 1, hs(c, .85) if back else G[0]); P(im, x + (0 if back else 1), top - 1, 1, 1, c)
        _pot(im, 3, 18, pot); return fin(im)
    im = new(17, 23)   # round bush
    P(im, 8, 10, 1, 8, '#6b4a33')
    for (cx, cy, r, c) in [(8.5, 7, 6.5, G[1]), (5, 10, 4.5, G[1]), (12, 10, 4.5, G[2]), (9, 12, 5, G[2]), (6.5, 5.5, 3.5, G[0]), (10.5, 4.5, 2, G[0])]: disc(im, cx, cy, r, c)
    for _ in range(7):
        x, y = rnd.randint(3, 13), rnd.randint(3, 14)
        if im.getpixel((x, y))[3]: P(im, x, y, 2, 1, G[2] if x > 8 else G[0])
    _pot(im, 5, 18, pot); return fin(im)

# ------------------------------------------------------------------ furniture
BOOK_COLORS = ['#b9443f', '#3468b8', '#2aa5a0', '#2f8f52', '#6a4fb0', '#e9e4da', '#c4567f']
def cabinet(seed=0, w=22):
    rnd = random.Random(seed); im = new(w, 16)
    P(im, 0, 0, w, 4, '#c79057'); P(im, 0, 0, w, 1, '#e0ad74'); P(im, 0, 4, w, 12, '#a87444'); P(im, 1, 5, w - 2, 4, '#6b4526'); P(im, 1, 10, w - 2, 5, '#6b4526')
    for row, hh in ((5, 4), (10, 5)):
        x = 2
        while x < w - 3:
            bw = rnd.choice([1, 2]); d = rnd.choice([0, 0, 1]); P(im, x, row + d, bw, hh - d, rnd.choice(BOOK_COLORS)); x += bw + rnd.choice([0, 0, 1])
    return fin(im)

def bin_():
    im = new(6, 7); P(im, 0, 0, 6, 1, '#8a93b5'); P(im, 0, 1, 6, 6, '#6d7699'); P(im, 4, 1, 2, 6, '#565e80'); P(im, 1, 0, 4, 1, DARK); return fin(im)

def sofa(w=46, c='#f08a3c'):
    im = new(w, 20)
    P(im, 2, 0, w - 4, 10, hs(c, .85)); P(im, 2, 0, w - 4, 1, hs(c, 1.25)); P(im, 2, 1, w - 4, 1, hs(c, 1.05))
    P(im, 4, 7, w - 8, 8, c); P(im, 4, 7, w - 8, 1, hs(c, 1.2)); P(im, w // 2, 7, 1, 8, hs(c, .82)); P(im, 4, 14, w - 8, 1, hs(c, .85))
    P(im, 0, 5, 5, 12, hs(c, .92)); P(im, w - 5, 5, 5, 12, hs(c, .8)); P(im, 0, 5, 5, 1, hs(c, 1.25)); P(im, w - 5, 5, 5, 1, hs(c, 1.1))
    P(im, 4, 15, w - 8, 3, hs(c, .72)); P(im, 2, 18, 3, 2, '#7a4a22'); P(im, w - 5, 18, 3, 2, '#7a4a22')
    P(im, 6, 4, 7, 5, '#f4f1ea'); P(im, 6, 4, 7, 1, '#ffffff'); P(im, w - 13, 4, 7, 5, '#7ac7c4'); P(im, w - 13, 4, 7, 1, '#a5e0dc')
    return fin(im)

def pouf(c='#7ac7c4'):
    im = new(11, 8); disc(im, 5.5, 3, 5.5, c, ry=3); P(im, 1, 3, 9, 4, hs(c, .85)); P(im, 2, 7, 7, 1, hs(c, .7)); disc(im, 5.5, 2.6, 4.5, hs(c, 1.12), ry=2); return fin(im)

def coffee_table():
    im = new(24, 13); disc(im, 12, 4.5, 12, '#b98253', ry=4.5); disc(im, 12, 4, 11, '#c9905e', ry=3.6); P(im, 4, 7, 16, 2, '#8a5c33')
    P(im, 10, 9, 4, 3, '#6b4526'); P(im, 7, 12, 10, 1, '#6b4526'); P(im, 7, 2, 4, 3, '#f4f4f8'); P(im, 8, 2, 2, 1, '#5b3a29'); P(im, 13, 3, 6, 3, '#3b7dd8'); P(im, 14, 4, 4, 1, '#9be3ff')
    return fin(im)

def floor_lamp():
    im = new(9, 28); P(im, 1, 0, 7, 1, '#ffffff'); P(im, 0, 1, 9, 6, '#fbf5e4'); P(im, 6, 1, 3, 6, '#e9dfc6'); P(im, 0, 6, 9, 1, '#d6cab0')
    P(im, 4, 7, 1, 18, DARK); P(im, 2, 25, 5, 2, DARK); P(im, 2, 25, 5, 1, hs(DARK, 1.3)); return fin(im)

def glow(r=18, c='#fff3d6', a=40):
    im = new(2 * r, 2 * r); disc(im, r, r, r, c, a // 3); disc(im, r, r, r * .68, c, a // 2); disc(im, r, r, r * .4, c, a); return im

def water_cooler():
    im = new(10, 22); P(im, 2, 0, 6, 8, '#bfe3f5'); P(im, 3, 1, 1, 5, '#e8f6fd'); P(im, 6, 1, 2, 7, '#9fd0ea'); P(im, 3, 0, 4, 1, '#e8f6fd')
    P(im, 1, 8, 8, 13, '#f4f4f8'); P(im, 7, 8, 2, 13, '#d5d8e3'); P(im, 1, 8, 8, 1, '#ffffff'); P(im, 3, 11, 1, 2, '#3b7dd8'); P(im, 6, 11, 1, 2, '#e2532f'); P(im, 2, 14, 6, 1, '#8088a6'); P(im, 1, 20, 8, 1, '#b9bfd2')
    return fin(im)

def counter(w=46):
    im = new(w, 20); P(im, 0, 0, w, 7, '#f6f2ea'); P(im, 0, 0, w, 1, '#ffffff'); P(im, 0, 6, w, 1, '#d9d2c4')
    P(im, 0, 7, w, 13, '#8fa3b8'); P(im, 0, 7, w, 1, hs('#8fa3b8', .85)); P(im, 0, 19, w, 1, hs('#8fa3b8', .7))
    for x in range(0, w, 11): P(im, x, 8, 1, 11, hs('#8fa3b8', .85)); P(im, x + 8, 12, 2, 1, '#f4f4f8')
    return fin(im)

def coffee_machine():
    im = new(9, 11); P(im, 0, 0, 9, 11, '#3d4463'); P(im, 0, 0, 9, 1, hs('#3d4463', 1.35)); P(im, 1, 2, 7, 3, '#23263a'); P(im, 6, 3, 1, 1, '#5ee08a'); P(im, 2, 6, 5, 4, '#23263a'); P(im, 3, 7, 3, 3, '#f4f4f8'); P(im, 4, 7, 1, 1, '#5b3a29')
    return fin(im)

def fridge():
    im = new(13, 24); P(im, 0, 0, 13, 4, '#e9edf3'); P(im, 0, 0, 13, 1, '#ffffff'); P(im, 0, 4, 13, 20, '#d5dbe6'); P(im, 10, 4, 3, 20, '#bcc4d3'); P(im, 0, 11, 13, 1, '#aab3c6'); P(im, 2, 6, 1, 4, '#8a93b5'); P(im, 2, 13, 1, 6, '#8a93b5'); P(im, 5, 6, 3, 2, '#9be3ff'); P(im, 6, 14, 2, 2, '#ff9bb3')
    return fin(im)

def boxes():
    im = new(18, 16); c = '#c2a37c'
    P(im, 0, 6, 12, 10, c); P(im, 0, 6, 12, 2, hs(c, 1.15)); P(im, 9, 8, 3, 8, hs(c, .85)); P(im, 5, 6, 2, 10, '#e3d3b6')
    P(im, 8, 0, 10, 8, hs(c, .95)); P(im, 8, 0, 10, 2, hs(c, 1.15)); P(im, 15, 2, 3, 6, hs(c, .8)); P(im, 12, 0, 2, 8, '#e3d3b6')
    P(im, 11, 9, 7, 7, hs(c, .9)); P(im, 11, 9, 7, 2, hs(c, 1.1)); P(im, 14, 9, 1, 7, '#e3d3b6')
    return fin(im)

def bench(w=30):
    im = new(w, 10); P(im, 0, 0, w, 5, '#c9905e'); P(im, 0, 0, w, 1, '#e0ad74'); P(im, 0, 4, w, 1, '#a87444'); P(im, 0, 5, w, 2, '#8a5c33'); P(im, 2, 7, 2, 3, '#6b4526'); P(im, w - 4, 7, 2, 3, '#6b4526'); return fin(im)

def round_table():
    im = new(22, 16); disc(im, 11, 5, 11, '#e9dcc4', ry=5); disc(im, 11, 4.4, 10, '#f6efe0', ry=4); P(im, 4, 8, 14, 2, '#cdbb9b'); P(im, 10, 10, 2, 4, DARK); P(im, 6, 14, 10, 1, DARK); P(im, 8, 2, 5, 4, '#9be3ff'); P(im, 9, 3, 3, 1, '#ffffff'); return fin(im)

def stool(c='#4f5885'):
    im = new(8, 9); disc(im, 4, 2.5, 4, c, ry=2.5); disc(im, 4, 2.2, 3, hs(c, 1.2), ry=1.6); P(im, 1, 4, 6, 1, hs(c, .8)); P(im, 3, 5, 2, 3, '#3a3f5c'); P(im, 1, 8, 6, 1, '#2f3350'); return fin(im)

# ------------------------------------------------------------------ surfaces
def wood(w, h, seed=7):
    im = new(w, h); rnd = random.Random(seed)
    for y in range(0, h, 6):
        x = -rnd.randint(0, 30)
        while x < w:
            L = rnd.randint(40, 70); base = rnd.choice(['#ead3b3', '#e8d0af', '#ecd6b7', '#e6ccaa'])
            P(im, x, y, L, 6, base); P(im, x, y + 5, L, 1, '#dfc6a3'); P(im, x + L - 1, y, 1, 5, '#dfc6a3')
            if rnd.random() < .35: P(im, x + rnd.randint(4, L - 6), y + rnd.randint(1, 3), 3, 1, '#e2c9a6')
            x += L
    return im

def rug(w, h, c, pattern=0):
    im = new(w, h); P(im, 1, 0, w - 2, h, c); P(im, 0, 1, w, h - 2, c)
    P(im, 2, 2, w - 4, 1, hs(c, 1.08)); P(im, 2, h - 3, w - 4, 1, hs(c, .9)); P(im, 2, 2, 1, h - 4, hs(c, 1.08)); P(im, w - 3, 2, 1, h - 4, hs(c, .9))
    if pattern == 1:
        P(im, 5, 5, w - 10, 1, hs(c, .92)); P(im, 5, h - 6, w - 10, 1, hs(c, .92)); P(im, 5, 5, 1, h - 10, hs(c, .92)); P(im, w - 6, 5, 1, h - 10, hs(c, .92))
    if pattern == 2:
        for x in range(8, w - 8, 8): P(im, x, 6, 4, 1, hs(c, 1.1)); P(im, x + 4, h - 7, 4, 1, hs(c, 1.1))
        for x in range(1, w - 1, 2): P(im, x, 0, 1, 1, hs(c, .8)); P(im, x, h - 1, 1, 1, hs(c, .8))
    return im
