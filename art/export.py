"""Exports every piece as its own PNG (upscaled without smoothing) and writes sprites.js with their sizes
and, for the lit windows, where each person's screen and hands are. Also writes the line icons (icons.py).
Usage: python3 export.py <mod folder>"""
import os, sys, json, random
from core import *
import interior as I, exterior as X, icons, graffiti_glyphs as G

OUT = sys.argv[1]; os.makedirs(OUT + '/sprites', exist_ok=True)
SIZES, SPOTS = {}, {}
def save(name, im, scale=6):
    SIZES[name] = [im.size[0], im.size[1]]
    if im.info.get('spots'): SPOTS[name] = im.info['spots']
    im.resize((im.size[0] * scale, im.size[1] * scale), Image.NEAREST).save(f'{OUT}/sprites/{name}.png', optimize=True)

# ---- people: 12 fixed variants, four poses each
H, S, K = I.HAIRS, I.SHIRTS, I.SKINS
PEOPLE = [(H[0], S[1], K[0], 0, '#e2532f'), (H[1], S[4], K[3], 1, '#3b7dd8'), (H[2], S[3], K[0], 2, '#2aa5a0'), (H[4], S[2], K[2], 3, '#e2532f'),
          (H[3], S[0], K[4], 4, '#3b7dd8'), (H[6], S[6], K[3], 5, '#2aa5a0'), (H[5], S[5], K[1], 0, '#e2532f'), (H[0], S[7], K[2], 1, '#3b7dd8'),
          (H[1], S[6], K[1], 5, '#2aa5a0'), (H[2], S[0], K[4], 3, '#e2532f'), (H[4], S[1], K[0], 2, '#3b7dd8'), (H[3], S[3], K[2], 4, '#e2532f')]
for i, (hair, shirt, skin, style, acc) in enumerate(PEOPLE):
    save(f'p{i}_front', I.person_front(hair, shirt, skin=skin, style=style, accent=acc))
    save(f'p{i}_sitf', I.sitter_front(hair, shirt, skin, style, acc))
    save(f'p{i}_sitb', I.sitter_back(hair, shirt, skin, style, acc))
    save(f'p{i}_sofa', I.sofa_sitter(hair, shirt, skin=skin, style=style, accent=acc))
save('me_front', I.person_front(H[4], S[7], skin=K[1], style=0))

# ---- workstation and status
save('desk', I.desk()); save('chair', I.chair()); save('keyboard', I.keyboard()); save('mouse', I.mouse())
for k in range(3): save(f'mon_work_{k}', I.monitor('work', k + 1))
for k in ('wait', 'done', 'idle'): save(f'mon_{k}', I.monitor(k))
for k in ('work', 'wait', 'done', 'idle'): save(f'monb_{k}', I.monitor_back(k))
for k, c in enumerate(['#e2532f', '#3b7dd8', '#7a5cc7', '#f4f1ea']): save(f'prop_mug_{k}', I.mug(c))
for n, fn in (('paper', I.paper), ('notes', I.notes), ('lamp', I.desk_lamp), ('succulent', I.succulent), ('robot', I.robot), ('books', I.books), ('headphones', I.headphones), ('photo', I.photo)):
    save('prop_' + n, fn())
save('bubble', I.bubble_wait()); save('bubble_done', I.bubble_done()); save('ring', I.ring()); save('zzz', I.zzz()); save('sparkle', I.sparkle()); save('sparkle_w', I.sparkle('#ffffff'))

# ---- walls
def whiteboard3():
    """A three-column whiteboard: to do, in progress, done."""
    w, h = I.WB_W, I.WB_H; im = new(w, h)
    P(im, 0, 0, w, h - 2, '#a7aec6'); P(im, 1, 1, w - 2, h - 4, '#fbfaf5')
    P(im, 1, 1, w - 2, 5, '#e3e7f2'); P(im, 1, 5, w - 2, 1, '#cfd5e6')
    for k in (1, 2): P(im, 1 + k * 17 - 1, 6, 1, h - 9, '#e4e2dc')
    P(im, 1, h - 4, w - 2, 1, '#e4e2dc')
    P(im, 0, h - 2, w, 2, '#8088a6'); P(im, 3, h - 2, 5, 1, '#e2532f'); P(im, 10, h - 2, 4, 1, '#3b7dd8'); P(im, w - 8, h - 2, 5, 1, '#f4f1ea')
    return fin(im)
save('whiteboard', I.whiteboard()); save('door_r', I.door('right')); save('door_l', I.door('left'))
for k in range(3): save(f'picture_{k}', I.picture(k)); save(f'window_{k}', I.wall_window(26, 14, True, k))
save('clock', I.clock()); save('notice', I.notice_board())

# ---- plants and furniture
POTS = ['#f4f4f8', '#c9764a', '#8fa3b8']
for kind in range(3):
    for v in range(3): save(f'plant_{kind}_{v}', I.plant(kind, kind * 7 + v + 1, POTS[v]))
for k in range(3): save(f'cabinet_{k}', I.cabinet(k + 1))
for n, im in (('bin', I.bin_()), ('sofa', I.sofa()), ('pouf_0', I.pouf('#7ac7c4')), ('pouf_1', I.pouf('#c3b9e0')), ('coffee_table', I.coffee_table()), ('floor_lamp', I.floor_lamp()),
              ('water_cooler', I.water_cooler()), ('counter', I.counter()), ('coffee_machine', I.coffee_machine()), ('fridge', I.fridge()), ('boxes', I.boxes()), ('bench', I.bench()),
              ('round_table', I.round_table()), ('stool', I.stool())):
    save(n, im)
save('glow', I.glow(22), 3)
save('wood', I.wood(300, 240, 7), 3)

# ---- facade
def stars_tile(w=220, h=150, seed=5):
    im = new(w, h); rnd = random.Random(seed)
    for _ in range(46):
        x, y = rnd.randint(1, w - 2), rnd.randint(1, h - 2); c = rnd.choice(['#ffffff', '#c9d6e0', '#94b0c2', '#94b0c2'])
        P(im, x, y, 1, 1, c, rnd.choice([255, 200, 140]))
        if rnd.random() < .08: P(im, x - 1, y, 3, 1, c, 120); P(im, x, y - 1, 1, 3, c, 120)
    return im
def facade_body(w=292):
    """A floor module without colored lights or windows: the app adds those. A concrete slab on top carries the painted board."""
    FH, SH = X.FLOOR_H, X.SHIFT
    im = new(w, FH)
    P(im, 0, 0, w, FH, X.BODY)
    for x in range(8, w, 14): P(im, x, SH + 4, 1, FH - SH - 7, '#272c41')
    P(im, 0, FH - 2, w, 2, X.BODY_LO)
    # the slab between levels: where the sign lives (approved design: a band, sign inside, never behind the chips)
    P(im, 0, 0, w, X.SLAB, '#39415f'); P(im, 0, 0, w, 1, '#5a6488'); P(im, 0, X.SLAB - 1, w, 1, '#141a30')
    bx, by, bw_, bh = X.SIGN_X, 2, X.SIGN_W, 11
    P(im, bx - 1, by - 1, bw_ + 2, bh + 2, '#2e1c12'); P(im, bx, by, bw_, bh, '#6b4430')
    P(im, bx, by, bw_, 1, '#8a5a3c'); P(im, bx, by + bh - 1, bw_, 1, '#4a2f20')
    for dx, dy in ((2, 2), (bw_ - 3, 2), (2, bh - 3), (bw_ - 3, bh - 3)): P(im, bx + dx, by + dy, 1, 1, '#b9a98f')
    for (x, bw) in X.bay_rects(w, 4):
        P(im, x - 4, SH + 5, 1, 38, '#3f4763'); P(im, x - 3, SH + 5, 1, 38, '#232840')
        P(im, x, SH + 36, bw, 7, '#161a2e'); P(im, x, SH + 36, bw, 1, X.FRAME)
    return im
def letter_outline(ch):
    """A letter's dark outline and red shadow in their real colors (an svg can only carry one ink)."""
    im = new(10, 10)
    fill = {(1 + x, 1 + y) for y, r in enumerate(G.F[ch].split('/')) for x, c in enumerate(r) if c == '#'}
    dark = {(a + i, b + j) for a, b in fill for i in (-1, 0, 1) for j in (-1, 0, 1)}
    for (x, y) in {(a + 1, b + 1) for a, b in dark} - dark:
        if x < 10 and y < 10: P(im, x, y, 1, 1, '#b13e53')
    for (x, y) in dark: P(im, x, y, 1, 1, '#0a0e2c')
    return im
save('stars', stars_tile(), 3); save('moon', X.moon()); save('skyline', X.skyline(220, 96, 2), 3); save('ground', X.ground(220, 24), 3)
for k in range(4): save(f'cloud_{k}', X.cloud([50, 62, 40, 44][k], k + 1), 3)
save('roof', X.roof(292)); save('lobby', X.lobby(292)); save('floor_body', facade_body()); save('halo', X.halo(63, 28))
for n in (1, 2, 3):
    for v in range(4): save(f'win_lit_{n}_{v}', X.window_lit(n * 11 + v * 5 + 1, n, 63))
for v in range(3): save(f'win_dark_{v}', X.window_dark(v, 63))
for ch in G.F:
    if G.F[ch]: save('go_' + G.NAMES.get(ch, ch), letter_outline(ch))
save('beacon', X.beacon()); save('beacon_done', X.beacon_done()); save('beacon_work', X.beacon_work()); save('lamp_post', X.lamp_post()); save('lamp_glow', X.lamp_glow(), 3); save('bench_out', X.bench_out()); save('path', X.path(96, 24))
for k in range(4): save(f'tree_{k}', X.tree(k + 1))
for k in range(6): save(f'hedge_{k}', X.hedge(26, k))

with open(OUT + '/sprites.js', 'w') as f:
    f.write('// Generated by the art exporter: sprite name -> [width, height] in art pixels.\n')
    f.write('export const SP = ' + json.dumps(SIZES, separators=(',', ':')) + ';\n')
    f.write(f'export const PEOPLE = {len(PEOPLE)};\n')
    f.write('// Lit windows: one [screen x, screen y, hands x, hands y] per person inside.\n')
    f.write('export const SPOTS = ' + json.dumps(SPOTS, separators=(',', ':')) + ';\n')
icons.write(OUT)
print(len(SIZES), 'sprites;', sum(os.path.getsize(f'{OUT}/sprites/{n}.png') for n in SIZES) // 1024, 'KB')
print(json.dumps({k: SIZES[k] for k in ['desk', 'chair', 'p0_front', 'p0_sitf', 'p0_sitb', 'p0_sofa', 'mon_wait', 'monb_work', 'whiteboard', 'door_r', 'window_0', 'plant_0_0', 'plant_1_0', 'plant_2_0', 'cabinet_0', 'sofa', 'counter', 'fridge', 'coffee_machine', 'floor_lamp', 'glow', 'bubble', 'ring', 'zzz', 'halo', 'beacon', 'tree_0', 'hedge_0', 'lamp_post', 'lamp_glow', 'moon', 'round_table', 'stool', 'coffee_table', 'pouf_0', 'water_cooler', 'bench', 'boxes', 'bin', 'notice', 'clock', 'picture_0', 'bench_out', 'path', 'keyboard', 'mouse']}))
