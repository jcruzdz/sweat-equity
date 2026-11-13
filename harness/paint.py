"""Pinta la lista de dibujo que produjo el mod, con los sprites reales, para ver lo que deberia mostrar."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
SPR = '../build/sweat-equity/sprites/'
B, Rg = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
cache = {}
def rgba(c):
    c = c.lstrip('#'); a = int(c[6:8], 16) if len(c) >= 8 else 255
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)
def paint(name):
    d = json.load(open(f'out/{name}.json')); W, H = round(d['w']), round(d['h'])
    im = Image.new('RGBA', (W, H), rgba(d.get('bg') or '#0a0e2c'))
    for o in d['ops']:
        x, y = round(o['x']), round(o['y'])
        if o['k'] == 'img':
            f = os.path.basename(o['src'])
            if f not in cache: cache[f] = Image.open(SPR + f).convert('RGBA')
            w, h = max(1, round(o['w'])), max(1, round(o['h']))
            lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); lay.paste(cache[f].resize((w, h), Image.NEAREST), (x, y)); im = Image.alpha_composite(im, lay)
        elif o['k'] == 'svg':
            import subprocess, tempfile
            w, h = max(1, round(o['w'])), max(1, round(o['h']))
            if w < 2: continue
            svg = open('../build/sweat-equity/icons/' + os.path.basename(o['src'])).read().replace('currentColor', '#' + (o['color'] or '#ffffff').lstrip('#')[:6])
            tf = tempfile.NamedTemporaryFile(suffix='.svg', delete=False); tf.write(svg.encode()); tf.close()
            r = subprocess.run(['rsvg-convert', '-w', str(w), '-h', str(h), tf.name], capture_output=True)
            os.unlink(tf.name)
            if r.returncode == 0:
                import io
                ic = Image.open(io.BytesIO(r.stdout)).convert('RGBA'); lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); lay.paste(ic, (x, y)); im = Image.alpha_composite(im, lay)
        elif o['k'] == 'box':
            w, h = max(1, round(o['w'])), max(1, round(o['h']))
            lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dr = ImageDraw.Draw(lay)
            dr.rounded_rectangle([x, y, x + w - 1, y + h - 1], radius=min(round(o.get('r') or 0), h // 2), fill=rgba(o['bg']) if o['bg'] else None,
                                 outline=rgba(o['border']) if o['border'] else None, width=max(1, round(o.get('bw') or 1)))
            im = Image.alpha_composite(im, lay)
        else:
            dr = ImageDraw.Draw(im); f = ImageFont.truetype(B if o['bold'] else Rg, max(6, round(o['fs']))); t = o['t']
            if dr.textlength(t, font=f) > o['w'] + 1:
                while len(t) > 1 and dr.textlength(t + '…', font=f) > o['w']: t = t[:-1]
                t += '…'
            dr.text((x, y), t, font=f, fill=rgba(o['color']))
    im.convert('RGB').save(f'out/{name}.png'); return im.size
for n in sys.argv[1:]: print(n, paint(n))
