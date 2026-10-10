"""Refresh public DG promotion banners; no customer account or SMS access.

Run from the repository root. Standard library only. On a source/parser failure,
leave the last successful snapshot intact; the UI labels it stale after 24 hours.
"""
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import hashlib
import json
import re

SOURCE = 'https://www.dollargeneral.com/'
OUTPUT = Path('deal-scout/dg-promotions.json')
MONTHS = {m.lower(): i for i, m in enumerate(['January','February','March','April','May','June','July','August','September','October','November','December'], 1)}


def offer_date(title, asset):
    # Only use an explicit calendar day and source year. No guesses about today.
    year = re.search(r'/by-fiscal-year/(20\d{2})/', asset)
    day = re.search(r'\b(' + '|'.join(MONTHS) + r')\s+(\d{1,2})(?:st|nd|rd|th)?(?!\d)', title, re.I)
    if not year or not day:
        return ''
    # A range is not a single-day offer.
    if re.match(r'\s*[-–]\s*\d', title[day.end():]):
        return ''
    try:
        return date(int(year[1]), MONTHS[day[1].lower()], int(day[2])).isoformat()
    except ValueError:
        return ''


class Promotions(HTMLParser):
    def __init__(self):
        super().__init__()
        self.offers = {}
        self.image_components = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag != 'div' or a.get('data-cmp-is') != 'image':
            return
        self.image_components += 1
        try:
            meta = next(iter(json.loads(a.get('data-cmp-data-layer', '{}')).values()))
        except (ValueError, StopIteration, AttributeError):
            return
        title = a.get('data-track-image', '').strip()
        link = meta.get('xdm:linkURL', '')
        u = urlparse(link)
        if u.scheme != 'https' or u.hostname != 'www.dollargeneral.com':
            return
        daily = bool(re.search(r'/on-sale/day-\d+-offer', u.path))
        coupon = u.path.startswith('/deals/coupons/')
        if not (daily or coupon) or not title:
            return
        image = a.get('data-cmp-src', '').replace('{.width}', '800').replace('%7B.width%7D', '800')
        v = urlparse(image)
        if v.scheme != 'https' or v.hostname not in {'s7d1.scene7.com', 'www.dollargeneral.com'}:
            image = ''
        day = offer_date(title, a.get('data-cmp-filereference', ''))
        # Date + text in key prevents a reused campaign URL overwriting a saved offer.
        key = hashlib.sha256((link + '|' + title + '|' + day).encode()).hexdigest()[:20]
        self.offers[key] = {'id': 'dg-' + key, 'title': title[:400], 'url': link,
                            'image': image, 'day': day,
                            'type': 'daily' if daily else 'coupon', 'source': SOURCE}


def parse(html):
    parser = Promotions()
    parser.feed(html)
    if parser.image_components < 5:
        raise ValueError('DG page structure not recognized; preserving previous feed')
    # If offer links remain but extractor misses them, fail instead of claiming none.
    if not parser.offers and re.search(r'/on-sale/day-\d+-offer|/deals/coupons/save-', html):
        raise ValueError('Promotion markup changed; preserving previous feed')
    return list(parser.offers.values())


def main():
    request = Request(SOURCE, headers={'User-Agent': 'DealScout-PublicPromotions/1.0', 'Accept': 'text/html'})
    with urlopen(request, timeout=30) as response:
        if urlparse(response.url).hostname != 'www.dollargeneral.com':
            raise ValueError('Unexpected source redirect')
        html = response.read(4_000_001)
    if len(html) > 4_000_000:
        raise ValueError('Source page exceeds size limit')
    offers = parse(html.decode('utf-8'))
    result = {'version': 1, 'source': SOURCE, 'checkedAt': datetime.now(timezone.utc).isoformat(),
              'offers': offers}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temp = OUTPUT.with_suffix('.json.tmp')
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    temp.replace(OUTPUT)
    print(f'Refreshed {len(offers)} public DG promotions')


if __name__ == '__main__':
    main()
