from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF

W, H = A4[1], A4[0]  # Landscape: 841.89 x 595.28

DARK_BG   = HexColor('#0F172A')
NAVY      = HexColor('#1E293B')
WINE      = HexColor('#C41E3A')
AMBER     = HexColor('#F59E0B')
WHITE     = colors.white
LGRAY     = HexColor('#F1F5F9')
MGRAY     = HexColor('#64748B')
DGRAY     = HexColor('#334155')
DARK_TEXT = HexColor('#1E293B')
GREEN     = HexColor('#10B981')
BLUE      = HexColor('#3B82F6')

def bg(c, col): c.setFillColor(col); c.rect(0, 0, W, H, fill=1, stroke=0)
def topbar(c, col=WINE): c.setFillColor(col); c.rect(0, H-6, W, 6, fill=1, stroke=0)
def txt(c, s, x, y, size=12, col=WHITE, bold=False, align='left'):
    c.setFillColor(col)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
    if align == 'center': c.drawCentredString(x, y, s)
    elif align == 'right': c.drawRightString(x, y, s)
    else: c.drawString(x, y, s)
def rect(c, x, y, w, h, fill, stroke=None, sw=1, r=4):
    c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke); c.setLineWidth(sw)
    else: c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)
def hrule(c, x, y, w, col=WINE, lw=2):
    c.setStrokeColor(col); c.setLineWidth(lw)
    c.line(x, y, x+w, y)

def wrap_text(c, text, x, y, max_width, size=10, col=DARK_TEXT, line_height=14):
    words = text.split()
    c.setFillColor(col); c.setFont('Helvetica', size)
    line = ''
    for w in words:
        test = (line + ' ' + w).strip()
        if c.stringWidth(test, 'Helvetica', size) <= max_width:
            line = test
        else:
            c.drawString(x, y, line); y -= line_height; line = w
    if line: c.drawString(x, y, line)
    return y


# ── SLIDE 1: COVER ──────────────────────────────────────────────────────────
def slide1(c):
    bg(c, DARK_BG); topbar(c)
    # Left accent bar
    c.setFillColor(WINE); c.rect(0, 0, 6, H, fill=1, stroke=0)
    # Brand
    txt(c, 'POURSTOCK', 60, H-110, 54, WHITE, bold=True)
    txt(c, 'AI-Powered Operations Platform', 62, H-145, 22, AMBER)
    txt(c, 'for Hotels & Restaurants', 62, H-172, 18, WHITE)
    hrule(c, 60, H-190, 400)
    txt(c, 'Unifying hotel and restaurant operations in real time.', 62, H-210, 13, HexColor('#94A3B8'))
    # Three stat boxes
    boxes = [('€4.2B', 'European Market TAM'), ('Production Live', 'Sønderborg Strand Hotel, DK'), ('Seed Stage', 'Denmark · 2026')]
    bw, bh, by = 210, 90, 60
    for i, (big, small) in enumerate(boxes):
        bx = 60 + i * (bw + 20)
        c.setFillColor(DGRAY); c.roundRect(bx, by, bw, bh, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(bx, by, 4, bh, fill=1, stroke=0)
        txt(c, big, bx+18, by+bh-32, 18, WHITE, bold=True)
        txt(c, small, bx+18, by+14, 10, HexColor('#94A3B8'))
    # Right decorative
    c.setFillColor(DGRAY); c.circle(W-100, H/2, 180, fill=1, stroke=0)
    c.setFillColor(WINE);  c.circle(W-100, H/2, 100, fill=1, stroke=0)
    c.setFillColor(AMBER); c.circle(W-100, H/2, 40, fill=1, stroke=0)
    txt(c, '🏨', W-120, H/2-15, 28)
    # Confidential
    txt(c, 'Confidential — Investor Presentation · 2026', 60, 18, 9, MGRAY)
    c.showPage()


# ── SLIDE 2: PROBLEM ─────────────────────────────────────────────────────────
def slide2(c):
    bg(c, WHITE); topbar(c)
    txt(c, '02 / THE PROBLEM', 50, H-35, 9, WINE, bold=True)
    txt(c, 'Hospitality Runs on Fragmented, Manual Systems', 50, H-72, 26, WINE, bold=True)
    txt(c, 'Every hotel manager knows this pain. It costs real money every single day.', 50, H-98, 12, MGRAY)
    hrule(c, 50, H-108, 740, LGRAY, 1)
    cards = [
        ('Printed Reservation PDFs', 'Dinner reservation lists printed at shift handover. Wrong tables, missed dietaries, wasted service prep.'),
        ('Spreadsheet Inventory', 'Beverage stock tracked manually on spreadsheets. 8-12% of F&B revenue lost to untracked waste every month.'),
        ('Verbal Housekeeping', 'Tasks assigned by phone and word of mouth. Rooms not ready, guest complaints, no audit trail.'),
        ('Zero Real-Time Link', 'Reception, restaurant, bar, and management operate in silos. No shared operational picture.'),
    ]
    icons = ['📄', '📊', '🗣', '🔗']
    cw, ch = 330, 150
    positions = [(50, 210), (400, 210), (50, 48), (400, 48)]
    for i, ((big, desc), icon, (cx, cy)) in enumerate(zip(cards, icons, positions)):
        c.setFillColor(LGRAY); c.roundRect(cx, cy, cw, ch, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(cx, cy, 4, ch, fill=1, stroke=0)
        txt(c, icon, cx+16, cy+ch-34, 18)
        txt(c, big, cx+16, cy+ch-56, 13, DARK_TEXT, bold=True)
        wrap_text(c, desc, cx+16, cy+ch-80, cw-30, 10, MGRAY, 14)
    # Bottom bar
    c.setFillColor(WINE); c.rect(0, 0, W, 38, fill=1, stroke=0)
    txt(c, 'Average hotel wastes 45 min/day on manual reservation transcription + loses ~10% of beverage revenue to stock inaccuracy', W/2, 13, 10, WHITE, align='center')
    c.showPage()


# ── SLIDE 3: MARKET ───────────────────────────────────────────────────────────
def slide3(c):
    bg(c, DARK_BG); topbar(c)
    txt(c, '03 / MARKET OPPORTUNITY', 50, H-35, 9, AMBER, bold=True)
    txt(c, "A \u20ac4.2B Market That Mid-Market Hotels Cannot Access", 50, H-72, 26, WHITE, bold=True)
    txt(c, '68% of European mid-market hotels will adopt cloud operations software by 2027 (IDC)', 50, H-98, 11, HexColor('#94A3B8'))
    hrule(c, 50, H-108, 740, DGRAY, 1)
    # Circles
    cx, cy, r1, r2, r3 = 220, 240, 170, 115, 60
    c.setFillColor(HexColor('#1D4ED8')); c.circle(cx, cy, r1, fill=1, stroke=0)
    c.setFillColor(AMBER);              c.circle(cx, cy, r2, fill=1, stroke=0)
    c.setFillColor(WINE);               c.circle(cx, cy, r3, fill=1, stroke=0)
    txt(c, '\u20ac4.2B', cx, cy+r1-28, 12, WHITE, bold=True, align='center')
    txt(c, 'TAM', cx, cy+r1-44, 9, WHITE, align='center')
    txt(c, '\u20ac380M', cx, cy+18, 12, WHITE, bold=True, align='center')
    txt(c, 'SAM', cx, cy+4, 9, WHITE, align='center')
    txt(c, '\u20ac4.8M', cx, cy-r3+26, 10, WHITE, bold=True, align='center')
    txt(c, 'SOM', cx, cy-r3+12, 8, WHITE, align='center')
    # Legend
    for col, label in [(HexColor('#1D4ED8'), 'TAM - European Hospitality Ops Software'), (AMBER, 'SAM - Nordic + DACH Mid-Market Hotels'), (WINE, 'SOM - Year 3 Target')]:
        pass
    # Right stats
    stats = [('38,000+', 'qualifying properties in target geography'), ('68%', 'mid-market hotels adopting cloud ops by 2027'), ('\u20ac17+/hr', 'Danish minimum wage driving efficiency demand'), ('14%', 'F&B cost inflation 2021-2024')]
    sx = 440
    for i, (num, label) in enumerate(stats):
        sy = H-140 - i*95
        c.setFillColor(DGRAY); c.roundRect(sx, sy, 360, 76, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(sx, sy, 4, 76, fill=1, stroke=0)
        txt(c, num, sx+18, sy+46, 26, AMBER, bold=True)
        wrap_text(c, label, sx+18, sy+26, 320, 10, HexColor('#94A3B8'), 13)
    c.showPage()


# ── SLIDE 4: SOLUTION ─────────────────────────────────────────────────────────
def slide4(c):
    bg(c, WHITE); topbar(c)
    txt(c, '04 / THE SOLUTION', 50, H-35, 9, WINE, bold=True)
    txt(c, 'One Platform. Every Department. Real Time.', 50, H-72, 26, WINE, bold=True)
    txt(c, 'PourStock replaces the entire fragmented stack with a single tool designed for live hospitality operations.', 50, H-98, 11, MGRAY)
    hrule(c, 50, H-108, 740, LGRAY, 1)
    modules = [
        ('Table Planning', 'AI parses PDFs in <2 min. Interactive floor plan. Live arrival timers.'),
        ('Inventory', 'Mobile quick-count. Partial bottles. Auto-reorder thresholds. Location tracking.'),
        ('Reception', 'Check-in/out workflows. Real-time room board. Guest directory.'),
        ('Housekeeping', 'Task queues triggered by checkout. Staff assignment. Zone management.'),
        ('Purchasing', 'Draft to Sent to Received. Vendor management. Auto-reorder suggestions.'),
        ('Reports', 'Occupancy, RevPAR, beverage trends, cost-of-goods, waste tracking.'),
    ]
    icons = ['🗓', '📦', '🏨', '🧹', '🛒', '📈']
    mw, mh = 230, 110
    for i, ((name, desc), icon) in enumerate(zip(modules, icons)):
        row, col = divmod(i, 3)
        mx = 50 + col * (mw + 18)
        my = H - 240 - row * (mh + 14)
        c.setFillColor(LGRAY); c.roundRect(mx, my, mw, mh, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(mx, my+mh-4, mw, 4, fill=1, stroke=0)
        txt(c, icon, mx+12, my+mh-32, 16)
        txt(c, name, mx+12, my+mh-52, 12, DARK_TEXT, bold=True)
        wrap_text(c, desc, mx+12, my+mh-70, mw-20, 9, MGRAY, 12)
    # Bottom highlight
    c.setFillColor(AMBER); c.roundRect(50, 18, 740, 36, 4, fill=1, stroke=0)
    txt(c, 'Real-time multi-device sync — all departments see the same live operational state simultaneously', W/2, 31, 11, DARK_TEXT, bold=True, align='center')
    c.showPage()


# ── SLIDE 5: PRODUCT ──────────────────────────────────────────────────────────
def slide5(c):
    bg(c, DARK_BG); topbar(c)
    txt(c, '05 / PRODUCT', 50, H-35, 9, AMBER, bold=True)
    txt(c, 'From PDF to Live Floor Plan in Under 2 Minutes', 50, H-72, 26, WHITE, bold=True)
    txt(c, 'The AI table planning feature — the show-stopping differentiator.', 50, H-98, 12, AMBER)
    hrule(c, 50, H-108, 740, DGRAY, 1)
    steps = [
        ('01', 'UPLOAD', 'Drag & drop dinner reservation PDF. Any format supported, including Danish Koekkenliste.'),
        ('02', 'AI PARSES', 'Gemini AI extracts guest names, room numbers, party sizes, dietary requirements — automatically.'),
        ('03', 'LIVE FLOOR PLAN', 'Interactive seating, drag-and-drop, arrival countdown timers, auto prep summary.'),
    ]
    sw, sh = 218, 220
    for i, (num, title, desc) in enumerate(steps):
        sx = 50 + i * (sw + 25)
        sy = H - 370
        c.setFillColor(DGRAY); c.roundRect(sx, sy, sw, sh, 8, fill=1, stroke=0)
        c.setFillColor(WINE); c.roundRect(sx, sy+sh-44, sw, 44, 8, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(sx, sy+sh-22, sw, 22, fill=1, stroke=0)
        txt(c, num, sx+sw/2, sy+sh-30, 14, WHITE, bold=True, align='center')
        txt(c, title, sx+sw/2, sy+sh-66, 13, AMBER, bold=True, align='center')
        wrap_text(c, desc, sx+14, sy+sh-96, sw-26, 10, HexColor('#CBD5E1'), 14)
        # Arrow between steps
        if i < 2:
            ax = sx + sw + 8
            ay = sy + sh/2
            c.setFillColor(AMBER); c.setStrokeColor(AMBER); c.setLineWidth(2)
            c.line(ax, ay, ax+16, ay)
            c.setFillColor(AMBER)
            p = c.beginPath()
            p.moveTo(ax+16, ay+5); p.lineTo(ax+16, ay-5); p.lineTo(ax+24, ay); p.close()
            c.drawPath(p, fill=1, stroke=0)
    # Quote
    c.setFillColor(WINE); c.roundRect(50, 48, 740, 62, 6, fill=1, stroke=0)
    txt(c, '"This replaced a 30-minute manual process. Staff now spend that time with guests."', W/2, 82, 12, WHITE, bold=True, align='center')
    txt(c, '— Sonderborg Strand Hotel, Denmark', W/2, 62, 10, HexColor('#FCA5A5'), align='center')
    c.showPage()


# ── SLIDE 6: TRACTION ─────────────────────────────────────────────────────────
def slide6(c):
    bg(c, WHITE); topbar(c)
    txt(c, '06 / TRACTION', 50, H-35, 9, WINE, bold=True)
    txt(c, 'Live in Production. Real Users. Real Operations.', 50, H-72, 26, WINE, bold=True)
    txt(c, 'This is not a prototype. PourStock runs daily operations at a real hotel.', 50, H-98, 11, MGRAY)
    hrule(c, 50, H-108, 740, LGRAY, 1)
    # Timeline
    milestones = [('Q1 2025', 'Platform\nBuilt', True), ('Q2 2025', 'Pilot Hotel\nLive', True), ('Q1 2026', '12-Phase Migration\nComplete', True), ('Q2 2026', 'Soak Validation\nActive', True), ('Q3 2026', 'Commercial\nActivation', False)]
    tl_y = H-200; tl_x0 = 60; tl_x1 = W-60; seg = (tl_x1-tl_x0)/4
    c.setStrokeColor(LGRAY); c.setLineWidth(3); c.line(tl_x0, tl_y, tl_x1, tl_y)
    for i, (date, label, done) in enumerate(milestones):
        mx = tl_x0 + i*seg
        col = WINE if done else AMBER
        c.setFillColor(col); c.circle(mx, tl_y, 10, fill=1, stroke=0)
        if done: txt(c, '✓', mx, tl_y-5, 10, WHITE, bold=True, align='center')
        else:    txt(c, '★', mx, tl_y-5, 10, WHITE, align='center')
        txt(c, date, mx, tl_y+22, 9, WINE, bold=True, align='center')
        for j, ln in enumerate(label.split('\n')):
            txt(c, ln, mx, tl_y-30-j*13, 9, DARK_TEXT, align='center')
    # Metrics
    metrics = [('1', 'Production\nHotel', 'Live daily use'), ('12', 'Migration\nPhases', 'Zero downtime'), ('6', 'Modules\nLive', 'All departments'), ('0', 'Production\nOutages', 'During migration')]
    mw, mh = 165, 110
    for i, (num, label, sub) in enumerate(metrics):
        mx = 50 + i*(mw+18); my = 45
        c.setFillColor(LGRAY); c.roundRect(mx, my, mw, mh, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.rect(mx, my, mw, 4, fill=1, stroke=0)
        txt(c, num, mx+mw/2, my+mh-36, 32, WINE, bold=True, align='center')
        for j, ln in enumerate(label.split('\n')):
            txt(c, ln, mx+mw/2, my+mh-60-j*14, 10, DARK_TEXT, bold=True, align='center')
        txt(c, sub, mx+mw/2, my+14, 9, MGRAY, align='center')
    c.showPage()


# ── SLIDE 7: BUSINESS MODEL ───────────────────────────────────────────────────
def slide7(c):
    bg(c, DARK_BG); topbar(c)
    txt(c, '07 / BUSINESS MODEL', 50, H-35, 9, AMBER, bold=True)
    txt(c, 'Per-Hotel SaaS — Simple, Scalable, Sticky', 50, H-72, 26, WHITE, bold=True)
    txt(c, 'No per-user fees. Per-hotel billing aligns with how hospitality teams operate and budget.', 50, H-98, 11, HexColor('#94A3B8'))
    hrule(c, 50, H-108, 740, DGRAY, 1)
    tiers = [
        ('STARTER', '\u20ac149/mo', '\u20ac1,539/yr', 'up to 30 rooms', ['Inventory Management', 'Table Planning', 'Purchase Orders', 'Reception & Stays'], False),
        ('PROFESSIONAL', '\u20ac399/mo', '\u20ac4,079/yr', '31–100 rooms', ['All Starter modules', 'Advanced Reports', 'AI Parsing (500 docs/mo)', 'Priority Support', 'Custom Parser Profiles'], True),
        ('ENTERPRISE', 'Custom', 'Custom/yr', 'Groups & Chains', ['Multi-property Dashboard', 'Custom Integrations', 'SLA Guarantee', 'Dedicated CSM', 'Corporate Reporting'], False),
    ]
    tw = 228; th = 280; ty = H-420
    for i, (name, price, annual, rooms, features, highlight) in enumerate(tiers):
        tx = 48 + i*(tw+14)
        border = WINE if highlight else DGRAY
        c.setFillColor(DGRAY); c.setStrokeColor(border); c.setLineWidth(3 if highlight else 1)
        c.roundRect(tx, ty, tw, th, 8, fill=1, stroke=1)
        header_col = WINE if highlight else HexColor('#334155')
        c.setFillColor(header_col); c.roundRect(tx, ty+th-52, tw, 52, 8, fill=1, stroke=0)
        c.setFillColor(header_col); c.rect(tx, ty+th-52, tw, 26, fill=1, stroke=0)
        txt(c, name, tx+tw/2, ty+th-28, 11, WHITE, bold=True, align='center')
        txt(c, price, tx+tw/2, ty+th-66, 20, AMBER if highlight else WHITE, bold=True, align='center')
        txt(c, annual, tx+tw/2, ty+th-84, 9, HexColor('#94A3B8'), align='center')
        txt(c, rooms, tx+tw/2, ty+th-100, 9, HexColor('#94A3B8'), align='center')
        for j, feat in enumerate(features):
            txt(c, '✓  '+feat, tx+14, ty+th-124-j*22, 9, HexColor('#CBD5E1'))
        if highlight:
            c.setFillColor(AMBER); c.roundRect(tx+tw/2-36, ty-14, 72, 18, 9, fill=1, stroke=0)
            txt(c, 'RECOMMENDED', tx+tw/2, ty-9, 7, DARK_TEXT, bold=True, align='center')
    # Unit economics
    econ = [('~82%', 'Gross Margin'), ('~3 months', 'CAC Payback'), ('~10:1', 'LTV:CAC Ratio'), ('\u20ac1,200', 'Est. CAC (Y1)')]
    ew = 168; ey = 18
    for i, (val, label) in enumerate(econ):
        ex = 50 + i*(ew+18)
        c.setFillColor(HexColor('#1E293B')); c.roundRect(ex, ey, ew, 52, 4, fill=1, stroke=0)
        txt(c, val, ex+ew/2, ey+30, 16, AMBER, bold=True, align='center')
        txt(c, label, ex+ew/2, ey+12, 9, HexColor('#94A3B8'), align='center')
    c.showPage()


# ── SLIDE 8: GO-TO-MARKET ─────────────────────────────────────────────────────
def slide8(c):
    bg(c, WHITE); topbar(c)
    txt(c, '08 / GO-TO-MARKET', 50, H-35, 9, WINE, bold=True)
    txt(c, 'Beachhead in Denmark, Then Nordic, Then Europe', 50, H-72, 26, WINE, bold=True)
    txt(c, 'Focused strategy: each phase builds on the last. No boiling the ocean.', 50, H-98, 11, MGRAY)
    hrule(c, 50, H-108, 740, LGRAY, 1)
    phases = [
        ('Phase 1', 'Months 1-6', 'Denmark', ['10 hotels via direct founder outreach', 'Sonderborg Strand Hotel as reference', 'HORESTA network + events', 'Early adopter pricing (20-30% off)'], WINE, '🇩🇰'),
        ('Phase 2', 'Months 7-15', 'Nordics', ['50 total hotels', 'Sweden & Norway expansion', 'Content marketing + trade shows', 'First customer success hire'], AMBER, '🇸🇪🇳🇴'),
        ('Phase 3', 'Months 16-30', 'DACH', ['200 total hotels', 'Reseller partnerships in DACH', 'First enterprise group contract', 'EUR 960K ARR target'], GREEN, '🇩🇪🇦🇹'),
    ]
    pw, ph = 228, 240; py = H-390
    for i, (phase, period, region, items, col, flag) in enumerate(phases):
        px = 48 + i*(pw+18)
        c.setFillColor(LGRAY); c.roundRect(px, py, pw, ph, 6, fill=1, stroke=0)
        c.setFillColor(col); c.roundRect(px, py+ph-46, pw, 46, 6, fill=1, stroke=0)
        c.setFillColor(col); c.rect(px, py+ph-26, pw, 26, fill=1, stroke=0)
        txt(c, phase+' · '+period, px+pw/2, py+ph-24, 9, WHITE, bold=True, align='center')
        txt(c, flag+' '+region, px+pw/2, py+ph-58, 13, WHITE if col!=AMBER else DARK_TEXT, bold=True, align='center')
        for j, item in enumerate(items):
            txt(c, '→ '+item, px+12, py+ph-86-j*26, 9, DARK_TEXT)
        # Hotel target
        targets = ['10 hotels', '50 hotels', '200 hotels']
        c.setFillColor(col); c.roundRect(px+pw/2-30, py+8, 60, 22, 11, fill=1, stroke=0)
        txt(c, targets[i], px+pw/2, py+14, 9, WHITE if col!=AMBER else DARK_TEXT, bold=True, align='center')
    # Arrow connectors
    for i in range(2):
        ax = 48+(i+1)*(pw+18)-18; ay = py+ph/2
        c.setFillColor(MGRAY); c.setStrokeColor(MGRAY); c.setLineWidth(1.5)
        c.line(ax, ay, ax+12, ay)
        c.setFillColor(MGRAY)
        p = c.beginPath()
        p.moveTo(ax+12, ay+4); p.lineTo(ax+12, ay-4); p.lineTo(ax+18, ay); p.close()
        c.drawPath(p, fill=1, stroke=0)
    # Unlock box
    c.setFillColor(AMBER); c.roundRect(50, 18, 740, 40, 6, fill=1, stroke=0)
    txt(c, 'Critical Unlock: Mews PMS integration opens access to Mews existing Nordic customer base via marketplace', W/2, 34, 10, DARK_TEXT, bold=True, align='center')
    txt(c, '(Target: Month 14)', W/2, 22, 9, DARK_TEXT, align='center')
    c.showPage()


# ── SLIDE 9: COMPETITIVE ──────────────────────────────────────────────────────
def slide9(c):
    bg(c, DARK_BG); topbar(c)
    txt(c, '09 / COMPETITIVE LANDSCAPE', 50, H-35, 9, AMBER, bold=True)
    txt(c, 'The Mid-Market Has No Integrated Competitor', 50, H-72, 26, WHITE, bold=True)
    txt(c, 'Enterprise players are too expensive. Point solutions are too narrow. PourStock owns the white space.', 50, H-98, 11, HexColor('#94A3B8'))
    hrule(c, 50, H-108, 740, DGRAY, 1)
    # 2x2 matrix
    mx0, my0, mw, mh = 50, 90, 340, 300
    c.setFillColor(DGRAY); c.roundRect(mx0, my0, mw, mh, 4, fill=1, stroke=0)
    mid_x = mx0+mw/2; mid_y = my0+mh/2
    c.setStrokeColor(MGRAY); c.setLineWidth(1)
    c.line(mid_x, my0+10, mid_x, my0+mh-10)
    c.line(mx0+10, mid_y, mx0+mw-10, mid_y)
    # Quadrant labels
    txt(c, 'Narrow Scope', mx0+mw/4, my0+8, 7, MGRAY, align='center')
    txt(c, 'Broad Scope', mx0+3*mw/4, my0+8, 7, MGRAY, align='center')
    txt(c, 'Mid-Market', mx0-6, my0+3*mh/4, 7, MGRAY, align='center')
    txt(c, 'Enterprise', mx0-6, my0+mh/4, 7, MGRAY, align='center')
    # Competitors
    dots = [
        (mx0+mw*0.22, my0+mh*0.28, 'SevenRooms\nResy', BLUE, 6),
        (mx0+mw*0.65, my0+mh*0.22, 'Mews\nOracle', MGRAY, 6),
        (mx0+mw*0.18, my0+mh*0.42, 'Bevspot\nMarketMan', MGRAY, 6),
        (mx0+mw*0.80, my0+mh*0.72, 'POURSTOCK', WINE, 10),
    ]
    for dx, dy, label, col, r in dots:
        c.setFillColor(col); c.circle(dx, dy, r, fill=1, stroke=0)
        for j, ln in enumerate(label.split('\n')):
            txt(c, ln, dx+r+4, dy+4-j*11, 7, WHITE if col!=MGRAY else HexColor('#94A3B8'))
    # "You are here" label
    txt(c, '← You are here', mx0+mw*0.80+14, my0+mh*0.72-18, 8, WINE, bold=True)
    # Table
    tx = 410; tw2 = 390
    headers = ['Competitor', 'Price/mo', 'Coverage', 'Gap']
    col_w = [130, 70, 80, 110]
    rows = [
        ('Mews / Oracle Opera', '\u20ac500-2K+', 'PMS only', 'No F&B, 6-wk impl.'),
        ('SevenRooms / Resy', '\u20ac300-600', 'Reservations', 'No hotel ops'),
        ('Bevspot / MarketMan', '\u20ac100-300', 'Inventory', 'No table planning'),
        ('PourStock', '\u20ac149-399', 'Full platform', 'Integrated solution'),
    ]
    ry = H-140
    c.setFillColor(WINE); c.roundRect(tx, ry, tw2, 24, 3, fill=1, stroke=0)
    hx = tx+8
    for i, (h, cw) in enumerate(zip(headers, col_w)):
        txt(c, h, hx, ry+8, 9, WHITE, bold=True); hx += cw
    for r_i, row in enumerate(rows):
        ry -= 28
        bg_col = HexColor('#1E3A2F') if row[0]=='PourStock' else (DGRAY if r_i%2==0 else HexColor('#253346'))
        c.setFillColor(bg_col); c.roundRect(tx, ry, tw2, 24, 2, fill=1, stroke=0)
        hx = tx+8
        for i, (cell, cw) in enumerate(zip(row, col_w)):
            col2 = AMBER if row[0]=='PourStock' else HexColor('#CBD5E1')
            txt(c, cell, hx, ry+8, 8, col2); hx += cw
    c.showPage()


# ── SLIDE 10: TECHNOLOGY ──────────────────────────────────────────────────────
def slide10(c):
    bg(c, WHITE); topbar(c)
    txt(c, '10 / TECHNOLOGY & MOAT', 50, H-35, 9, WINE, bold=True)
    txt(c, 'Built for Scale — Production-Grade Engineering from Day One', 50, H-72, 26, WINE, bold=True)
    txt(c, 'The technical foundation is a real competitive moat — not a story. Evidence below.', 50, H-98, 11, MGRAY)
    hrule(c, 50, H-108, 740, LGRAY, 1)
    pillars = [
        ('AI-Native', 'Per-hotel configurable parser profiles with SHA-256 content caching. Gemini AI extracts structured data from any PDF format. Not a generic API call.'),
        ('Multi-Tenant RLS', 'Row Level Security enforced at database layer. Data never crosses hotel boundaries — by architectural constraint, not application logic.'),
        ('Real-Time WebSocket', 'All devices sync instantly via Supabase Realtime. No polling. Reception, bar, kitchen, and housekeeping share the same live operational state.'),
        ('12-Phase Migration', 'Complete schema evolution from single-hotel to multi-tenant architecture — with zero production downtime. De-risks scaling to hundreds of hotels.'),
    ]
    icons = ['AI', 'RLS', 'WS', '12x']
    pw2 = 165; ph2 = 180
    for i, ((title, desc), icon) in enumerate(zip(pillars, icons)):
        px = 50 + i*(pw2+18); py = H-320
        c.setFillColor(LGRAY); c.roundRect(px, py, pw2, ph2, 6, fill=1, stroke=0)
        c.setFillColor(WINE); c.roundRect(px+pw2/2-24, py+ph2-44, 48, 34, 17, fill=1, stroke=0)
        txt(c, icon, px+pw2/2, py+ph2-28, 11, WHITE, bold=True, align='center')
        txt(c, title, px+pw2/2, py+ph2-66, 12, DARK_TEXT, bold=True, align='center')
        wrap_text(c, desc, px+12, py+ph2-90, pw2-22, 9, MGRAY, 13)
    # Architecture strip
    c.setFillColor(DARK_BG); c.roundRect(50, 88, 740, 62, 6, fill=1, stroke=0)
    txt(c, 'TECH STACK', 70, 128, 8, WINE, bold=True)
    stack = ['React 18 + TypeScript', 'Supabase PostgreSQL + RLS', 'Deno Edge Functions', 'Gemini AI', 'TanStack Query v5', 'Row Level Security']
    sx = 170
    for s in stack:
        c.setFillColor(DGRAY); c.roundRect(sx, 98, len(s)*6+16, 24, 4, fill=1, stroke=0)
        txt(c, s, sx+8, 105, 8, HexColor('#CBD5E1'))
        sx += len(s)*6+26
    # Bottom stat
    c.setFillColor(WINE); c.roundRect(50, 52, 740, 30, 4, fill=1, stroke=0)
    txt(c, '12 migration phases completed with ZERO production downtime — engineering credibility you can verify', W/2, 62, 10, WHITE, bold=True, align='center')
    c.showPage()


# ── SLIDE 11: FINANCIALS ──────────────────────────────────────────────────────
def slide11(c):
    bg(c, DARK_BG); topbar(c)
    txt(c, '11 / FINANCIAL PROJECTIONS', 50, H-35, 9, AMBER, bold=True)
    txt(c, 'Path to \u20ac1.3M ARR by Year 3', 50, H-72, 26, WHITE, bold=True)
    txt(c, '~80% gross margin. Conservative assumptions. Approaching break-even Year 3 without additional fundraising.', 50, H-98, 11, HexColor('#94A3B8'))
    hrule(c, 50, H-108, 740, DGRAY, 1)
    # Bar chart via reportlab graphics
    drawing = Drawing(360, 260)
    bc = VerticalBarChart()
    bc.x = 40; bc.y = 40; bc.width = 300; bc.height = 200
    bc.data = [(115, 497, 1340)]
    bc.bars[0].fillColor = WINE
    bc.categoryAxis.categoryNames = ['Year 1\n30 hotels', 'Year 2\n122 hotels', 'Year 3\n302 hotels']
    bc.valueAxis.valueMin = 0; bc.valueAxis.valueMax = 1500
    bc.valueAxis.valueStep = 300
    bc.categoryAxis.labels.fontName = 'Helvetica'; bc.categoryAxis.labels.fontSize = 9
    bc.categoryAxis.labels.fillColor = HexColor('#94A3B8')
    bc.valueAxis.labels.fontName = 'Helvetica'; bc.valueAxis.labels.fontSize = 9
    bc.valueAxis.labels.fillColor = HexColor('#94A3B8')
    
    bc.barWidth = 60; bc.groupSpacing = 20
    from reportlab.graphics.shapes import String as GString
    drawing.add(bc)
    renderPDF.draw(drawing, c, 55, H-420)
    # Table
    rows = [
        ('Metric', 'Year 1', 'Year 2', 'Year 3'),
        ('Hotels (EOY)', '30', '122', '302'),
        ('ARR', '\u20ac115K', '\u20ac497K', '\u20ac1.34M'),
        ('Gross Margin', '80%', '80%', '82%'),
        ('EBITDA', '-\u20ac132K', '-\u20ac156K', '-\u20ac5K'),
    ]
    col_w2 = [120, 90, 90, 90]; tx2 = 430; ty2 = H-160
    for r_i, row in enumerate(rows):
        bg_col = WINE if r_i==0 else (DGRAY if r_i%2==1 else HexColor('#253346'))
        row_h = 30
        c.setFillColor(bg_col); c.roundRect(tx2, ty2-r_i*row_h, sum(col_w2), row_h, 2, fill=1, stroke=0)
        hx = tx2+8
        for cell, cw in zip(row, col_w2):
            col2 = WHITE if r_i==0 else (AMBER if cell.startswith('\u20ac') else HexColor('#CBD5E1'))
            bold = r_i==0
            txt(c, cell, hx, ty2-r_i*row_h+10, 9, col2, bold=bold); hx += cw
    txt(c, '\u20ac ARR (\u2019000s)', 60, H-118, 9, MGRAY)
    c.showPage()


# ── SLIDE 12: THE ASK ─────────────────────────────────────────────────────────
def slide12(c):
    bg(c, WINE); topbar(c, AMBER)
    c.setFillColor(HexColor('#9B1A2E')); c.rect(0, 0, 6, H, fill=1, stroke=0)
    txt(c, '12 / THE ASK', 60, H-35, 9, HexColor('#FCA5A5'), bold=True)
    txt(c, 'Raising Seed Capital', 60, H-80, 38, WHITE, bold=True)
    txt(c, 'Building the Nordic Hospitality Operations Standard', 60, H-110, 18, HexColor('#FCA5A5'))
    hrule(c, 60, H-122, 720, HexColor('#9B1A2E'), 1)
    # Use of funds
    txt(c, 'USE OF FUNDS', 60, H-148, 10, AMBER, bold=True)
    funds = [('52%', 'Personnel', 'CSM hire + engineering\nfor integrations'), ('20%', 'Sales & Marketing', 'Nordic expansion,\ntrade shows, content'), ('18%', 'Infrastructure\n& Legal', 'Supabase, AI costs,\ncompliance'), ('10%', 'Working\nCapital', 'Reserve')]
    fw = 164; fh = 120; fy = H-300
    for i, (pct, label, desc) in enumerate(funds):
        fx = 60 + i*(fw+12)
        c.setFillColor(HexColor('#9B1A2E')); c.roundRect(fx, fy, fw, fh, 6, fill=1, stroke=0)
        txt(c, pct, fx+fw/2, fy+fh-34, 28, AMBER, bold=True, align='center')
        for j, ln in enumerate(label.split('\n')):
            txt(c, ln, fx+fw/2, fy+fh-56-j*14, 10, WHITE, bold=True, align='center')
        for j, ln in enumerate(desc.split('\n')):
            txt(c, ln, fx+fw/2, fy+fh-82-j*12, 8, HexColor('#FCA5A5'), align='center')
    # Milestones
    txt(c, 'MILESTONES THIS CAPITAL ACHIEVES', 60, H-330, 10, AMBER, bold=True)
    milestones2 = [('Month 14', 'Mews PMS integration live — opens Nordic marketplace channel'), ('Month 18', '50 paying hotels · \u20ac200K+ ARR · Stripe billing fully automated'), ('Month 20+', 'Series A preparation underway · Nordic market leadership established')]
    for i, (month, text) in enumerate(milestones2):
        my = H-362-i*44
        c.setFillColor(HexColor('#9B1A2E')); c.roundRect(60, my, 720, 36, 4, fill=1, stroke=0)
        c.setFillColor(AMBER); c.roundRect(60, my, 96, 36, 4, fill=1, stroke=0)
        txt(c, month, 108, my+12, 10, DARK_TEXT, bold=True, align='center')
        txt(c, text, 170, my+12, 10, WHITE)
    # Contact
    c.setFillColor(DARK_BG); c.rect(0, 0, W, 42, fill=1, stroke=0)
    txt(c, 'pourstock.com  ·  hello@pourstock.com  ·  Denmark  ·  Seed Stage 2026', W/2, 26, 10, HexColor('#94A3B8'), align='center')
    txt(c, 'Confidential — For Authorised Recipients Only', W/2, 12, 8, MGRAY, align='center')
    c.showPage()


# ── MAIN ──────────────────────────────────────────────────────────────────────
def build():
    out = '/home/user/pourstock-v2/docs/startup/pourstock-pitch-deck.pdf'
    c = canvas.Canvas(out, pagesize=(W, H))
    c.setTitle('PourStock — Investor Pitch Deck 2026')
    c.setAuthor('PourStock')
    c.setSubject('Seed Stage Investor Presentation')
    slide1(c)
    slide2(c)
    slide3(c)
    slide4(c)
    slide5(c)
    slide6(c)
    slide7(c)
    slide8(c)
    slide9(c)
    slide10(c)
    slide11(c)
    slide12(c)
    c.save()
    import os
    size_kb = os.path.getsize(out) / 1024
    print(f'PDF saved: {out}')
    print(f'File size: {size_kb:.1f} KB ({size_kb/1024:.2f} MB)')

build()
