"""Writes the line icons the tower uses (a floor's sign, the windows, the lobby, the bar and the panels) as SVG.
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
    'pause': ['<rect x="6" y="4" width="4" height="16" rx="1" />', '<rect x="14" y="4" width="4" height="16" rx="1" />'],
    'clipboard': ['<rect x="5" y="4" width="14" height="17" rx="2" />', '<path d="M9 4V2.5h6V4" />', '<path d="M9 11h6M9 15h4" />'],
    'robot': ['<rect x="5" y="8" width="14" height="11" rx="2" />', '<path d="M12 4v4" />', '<circle cx="12" cy="3" r="1" />', '<path d="M9.5 13h.01M14.5 13h.01" />', '<path d="M2 12v4M22 12v4" />'],
    'help': ['<circle cx="12" cy="12" r="9" />', '<path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14" />', '<path d="M12 17.5h.01" />'],
    'log': ['<path d="M9 6h11M9 12h11M9 18h11" />', '<path d="M4 6h.01M4 12h.01M4 18h.01" />'],
    'pr': ['<circle cx="6" cy="5" r="2" />', '<circle cx="6" cy="19" r="2" />', '<circle cx="18" cy="19" r="2" />', '<path d="M6 7v10" />', '<path d="M18 17V9a3 3 0 0 0-3-3h-4" />', '<path d="M13 3.5L10.5 6 13 8.5" />'],
    'check': ['<path d="M5 12.5l4.5 4.5L19 7" />'],
    'x': ['<path d="M6 6l12 12M18 6L6 18" />'],
    'person': ['<circle cx="12" cy="8" r="4" />', '<path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />'],
    'arrow': ['<path d="M4 12h15M14 7l5 5-5 5" />'],
}

def write(out):
    os.makedirs(out + '/icons', exist_ok=True)
    for name, parts in ICONS.items():
        with open(f'{out}/icons/{name}.svg', 'w') as f:
            f.write(HEAD + '\n' + ''.join(f'  {p}\n' for p in parts) + '</svg>\n')
    return len(ICONS)

if __name__ == '__main__':
    print(write(sys.argv[1]), 'icons')
