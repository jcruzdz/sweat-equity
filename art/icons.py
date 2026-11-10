"""Writes the three line icons the tower uses on a floor's sign (shown, hidden, edit) as SVG.
They are drawn with the current color, so the app tints them.
Usage: python3 icons.py <mod folder>"""
import os, sys

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">')
EYE = '<path d="M2 12c2.6-4.6 6-7 10-7s7.4 2.4 10 7c-2.6 4.6-6 7-10 7s-7.4-2.4-10-7z" />'
ICONS = {
    'eye': [EYE, '<circle cx="12" cy="12" r="3" />'],
    'eye-off': [EYE, '<path d="M4 4l16 16" />'],
    'pen': ['<path d="M4 20l1.2-5L16 4l4 4L9.2 18.8 4 20z" />', '<path d="M13.5 6.5l4 4" />'],
}

def write(out):
    os.makedirs(out + '/icons', exist_ok=True)
    for name, parts in ICONS.items():
        with open(f'{out}/icons/{name}.svg', 'w') as f:
            f.write(HEAD + '\n' + ''.join(f'  {p}\n' for p in parts) + '</svg>\n')
    return len(ICONS)

if __name__ == '__main__':
    print(write(sys.argv[1]), 'icons')
