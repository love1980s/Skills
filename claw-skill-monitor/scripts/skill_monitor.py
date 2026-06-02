from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

SEARCH_QUERIES = [
    "skill clawhub 发布 上线",
    "OpenClaw skill 官方 大厂",
    "clawhub skill 新功能 2026",
    "openclaw skill 微信 美团 抖音 淘宝 百度",
    "AI agent skill 上线 少数派 36kr",
]
SKILL_POSITIVE = ["skill", "clawhub", "openclaw", "技能", "插件", "上线", "发布"]
SKILL_NEGATIVE = ["malware", "malicious", "security", "hack", "漏洞", "安全", "教程", "入门"]
C_END = ["微信", "wechat", "weread", "美团", "meituan", "抖音", "douyin", "淘宝", "taobao", "小红书", "知乎", "百度", "外卖", "购物", "旅行", "天气", "翻译", "写作", "笔记", "日历", "新闻", "热点", "资讯", "音乐", "生活", "理财", "学习", "游戏", "邮件", "文档", "搜索", "网盘", "父母", "瑜伽", "小说", "ppt", "slide"]
B_END = ["aiops", "devops", "cmdb", "运维", "kubernetes", "k8s", "ci/cd", "pipeline", "terraform", "ansible", "grafana", "prometheus", "erp", "crm", "saas", "b2b", "seller", "卖家", "amazon seller", "temu", "cad", "dwg", "paddleocr", "json toolkit", "test case", "pull request", "pr review", "skill creation", "create skill", "litigation"]


def curl_fetch(url: str, timeout: int = 12) -> str:
    try:
        result = subprocess.run(
            ["curl", "-s", "-L", "--max-time", str(timeout), "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "-H", "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8", url],
            capture_output=True,
            text=True,
            timeout=timeout + 5,
            encoding="utf-8",
            errors="replace",
        )
        return result.stdout
    except Exception as exc:
        print(f"[curl error] {url[:80]}: {exc}", file=sys.stderr)
        return ""


def fetch_json(url: str) -> dict | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        print(f"[json error] {url[:80]}: {exc}", file=sys.stderr)
        return None


def strip_tags(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def search_bing(query: str) -> list[dict]:
    encoded = urllib.parse.quote(query)
    page = curl_fetch(f"https://cn.bing.com/search?q={encoded}&freshness=Week&sortby=Date&ensearch=0")
    if not page:
        return []
    blocks = re.findall(
        r'<h2[^>]*>.*?<a[^>]+href="(https?://[^"]+)"[^>]*>(.*?)</a>.*?</h2>.*?'
        r'(?:<p[^>]*>(.*?)</p>|<div[^>]*class="[^"]*b_caption[^"]*"[^>]*>(.*?)</div>)',
        page,
        re.DOTALL,
    )
    results = []
    for match in blocks[:15]:
        title = strip_tags(match[1])
        snippet = strip_tags(match[2] or match[3] or "")
        if title and len(title) > 4:
            results.append({"title": title, "url": match[0], "snippet": snippet[:300], "source": "Bing/news"})
    return results


def collect_news_results() -> list[dict]:
    seen, all_results = set(), []
    print("Step 1A: Bing/news search")
    for query in SEARCH_QUERIES:
        results = search_bing(query)
        print(f"  {query}: {len(results)}")
        for result in results:
            if result["url"] not in seen:
                seen.add(result["url"])
                all_results.append(result)
    return all_results


def collect_ai_bot_results() -> list[dict]:
    print("Step 1B: ai-bot.cn daily news")
    page = curl_fetch("https://ai-bot.cn/daily-ai-news/")
    if not page:
        return []
    hits = []
    for url, title in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>([^<]{6,120})</a>', page):
        title = strip_tags(title)
        if any(k.lower() in title.lower() for k in ["skill", "clawhub", "openclaw", "技能"]):
            hits.append({"title": title, "url": url, "snippet": "ai-bot.cn daily news hit", "source": "ai-bot.cn"})
    print(f"  keyword hits: {len(hits)}")
    return hits[:20]


def is_skill_article(title: str, snippet: str) -> bool:
    text = f"{title} {snippet}".lower()
    return any(k.lower() in text for k in SKILL_POSITIVE) and not any(k.lower() in text for k in SKILL_NEGATIVE)


def clawhub_search(query: str) -> dict | None:
    data = fetch_json(f"https://clawhub.ai/api/v1/search?q={urllib.parse.quote(query)}&limit=3")
    if not data or not data.get("results"):
        return None
    return data["results"][0]


def is_c_end_skill(name: str, summary: str) -> bool:
    text = f"{name} {summary}".lower()
    if any(k.lower() in text for k in B_END):
        return False
    if any(k.lower() in text for k in C_END):
        return True
    return True


def clawhub_newest(today: dt.date, days: int = 10) -> tuple[list[dict], int]:
    print(f"Step 1C: ClawHub newest, last {days} days")
    data = fetch_json("https://clawhub.ai/api/v1/skills?limit=50&sort=newest")
    if not data:
        return [], 0
    cutoff = today - dt.timedelta(days=days)
    results, skipped = [], 0
    for item in data.get("items", []):
        created = dt.date.fromtimestamp(item["createdAt"] / 1000)
        if created < cutoff:
            continue
        name = item.get("displayName") or item.get("slug") or "Unknown"
        summary = item.get("summary") or ""
        if not is_c_end_skill(name, summary):
            skipped += 1
            continue
        results.append({"name": name, "install_url": f"https://clawhub.ai/skills/{item['slug']}", "summary": summary[:200], "author": item.get("ownerHandle", "未知"), "source": f"ClawHub newest ({created})", "reason": f"近{days}天新上线，当前装机 {item.get('stats', {}).get('installsCurrent', 0)}"})
    return results, skipped


def build_results(news_results: list[dict], newest: list[dict]) -> tuple[list[dict], int]:
    print("Step 2: clean, enrich, and dedupe")
    results, seen, unconfirmed = [], set(), 0
    for article in news_results:
        if not is_skill_article(article["title"], article.get("snippet", "")):
            continue
        match = clawhub_search(article["title"])
        if match:
            item = {"name": match.get("displayName") or article["title"], "install_url": f"https://clawhub.ai/skills/{match['slug']}", "summary": (match.get("summary") or article.get("snippet") or "")[:200], "author": match.get("ownerHandle") or "未知", "source": article.get("source", "Bing/news"), "reason": "近期资讯命中，并可在 ClawHub 搜索到对应条目"}
        else:
            unconfirmed += 1
            item = {"name": article["title"], "install_url": article["url"], "summary": article.get("snippet", "")[:200], "author": "未知", "source": article.get("source", "Bing/news"), "reason": "近期资讯命中，但未能在 ClawHub 补全"}
        if item["install_url"] not in seen:
            seen.add(item["install_url"])
            results.append(item)
    for item in newest:
        if item["install_url"] not in seen:
            seen.add(item["install_url"])
            results.append(item)
    return results, unconfirmed


def report_groups(items: list[dict]) -> tuple[list[dict], list[dict], list[dict], int]:
    hot, aibot, newest, leads = [], [], [], 0
    for item in items:
        url = item.get("install_url", "")
        source = item.get("source", "").lower()
        if source.startswith("clawhub newest") and "clawhub.ai/skills/" in url:
            newest.append(item)
        elif "ai-bot" in source:
            aibot.append(item)
        elif "clawhub.ai/skills/" in url:
            hot.append(item)
        else:
            leads += 1
    return hot[:12], aibot[:12], newest[:36], leads


def write_json_and_text(output_dir: Path, today: dt.date, items: list[dict], diagnostics: dict) -> Path:
    json_path = output_dir / f"skill_discovery_{today}.json"
    txt_path = output_dir / f"skill_report_{today}.txt"
    json_path.write_text(json.dumps({"diagnostics": diagnostics, "items": items}, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = [f"天禧 Claw Skill 日报 · {today}  共 {len(items)} 条", "=" * 70, "选取原则：C端用户日常场景，排除运维/B端/开发者专用工具", "=" * 70]
    for index, item in enumerate(items, 1):
        lines += ["", f"【{index}】{item.get('name', '')}", f"  安装地址：{item.get('install_url', '')}", f"  作者/出品：{item.get('author', '未知')}", f"  Skill 简介：{item.get('summary', '') or '暂无'}", f"  推荐理由：{item.get('reason', '')}", f"  来源：{item.get('source', '')}"]
    txt_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path


def page_shell(today: str, hot: list[dict], aibot: list[dict], newest: list[dict], leads: int) -> str:
    total = len(hot) + len(aibot) + len(newest)
    payload = json.dumps({"hot": hot, "aibot": aibot, "new": newest}, ensure_ascii=False)
    return f'''<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>天禧 Claw Skill 日报 · {today}</title><style>
:root{{--bg:#f4f6fb;--surface:#fff;--surface-2:#f9fafb;--border:rgba(0,0,0,.06);--text-primary:#0d0d0d;--text-secondary:#5a6070;--text-muted:#9ba3b0;--red:#dc2626;--red-light:#fef2f2;--green:#16a34a;--green-light:#f0fdf4;--indigo:#4f46e5;--indigo-light:#eef2ff;--radius-sm:8px;--radius-md:14px;--radius-pill:999px;--shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);--shadow-lg:0 8px 32px rgba(0,0,0,.10),0 4px 12px rgba(0,0,0,.06)}}*{{box-sizing:border-box;margin:0;padding:0}}body{{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh}}.hero{{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#0ea5e9 100%);padding:48px 24px 40px}}.hero-inner,.page-body{{max-width:1020px;margin:0 auto}}.hero-eyebrow{{display:inline-flex;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:4px 12px;border-radius:var(--radius-pill);margin-bottom:14px}}.hero h1{{font-size:32px;font-weight:800;color:#fff;line-height:1.2}}.hero h1 span{{color:rgba(255,255,255,.6);font-weight:400}}.hero-meta{{margin-top:10px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}}.hero-stat{{color:rgba(255,255,255,.75);font-size:13px}}.hero-stat strong{{color:#fff}}.hero-principle{{margin-top:18px;display:inline-flex;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-size:12px;padding:8px 14px;border-radius:var(--radius-sm)}}.page-body{{padding:32px 24px 60px}}.section{{margin-bottom:40px}}.section-header{{display:flex;align-items:center;gap:12px;margin-bottom:16px}}.section-icon{{width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center}}.section-count{{font-size:12px;font-weight:600;padding:2px 8px;border-radius:var(--radius-pill)}}.hot{{background:var(--red-light);color:var(--red)}}.aibot{{background:var(--indigo-light);color:var(--indigo)}}.new{{background:var(--green-light);color:var(--green)}}.section-line{{flex:1;height:1px;background:var(--border)}}.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}}.card{{background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;overflow:hidden}}.card:hover{{box-shadow:var(--shadow-lg);transform:translateY(-2px)}}.card-accent{{height:3px;background:linear-gradient(90deg,var(--a),var(--b))}}.card-body{{padding:16px 18px 14px;display:flex;flex-direction:column;gap:10px;flex:1}}.card-top{{display:flex;align-items:flex-start;gap:12px}}.card-icon{{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}}.card-name{{font-size:14px;font-weight:700;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}.card-meta{{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}}.card-author,.card-source{{font-size:11px;color:var(--text-muted)}}.badge{{font-size:10px;font-weight:700;padding:2px 7px;border-radius:var(--radius-pill)}}.card-summary{{font-size:12.5px;color:var(--text-secondary);line-height:1.65;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}}.card-reason{{font-size:11.5px;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius-sm);padding:8px 10px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}}.card-footer{{padding:10px 18px 14px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);background:var(--surface-2);gap:12px}}.install-btn{{font-size:11.5px;font-weight:700;color:#fff;background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:6px 14px;border-radius:var(--radius-pill);text-decoration:none;white-space:nowrap}}.install-btn:after{{content:'→'}}@media(max-width:640px){{.hero{{padding:32px 16px 28px}}.hero h1{{font-size:24px}}.page-body{{padding:20px 16px 40px}}.grid{{grid-template-columns:1fr}}}}
</style></head><body><div class="hero"><div class="hero-inner"><div class="hero-eyebrow">Daily Skill Discovery</div><h1>天禧 Claw Skill 日报 <span>· {today}</span></h1><div class="hero-meta"><div class="hero-stat">精选 <strong>{total}</strong> 条</div><div class="hero-stat">媒体热点 <strong>{len(hot)}</strong></div><div class="hero-stat">ai-bot 资讯 <strong>{len(aibot)}</strong></div><div class="hero-stat">新上线 <strong>{len(newest)}</strong></div></div><div class="hero-principle">选取原则：C端用户日常场景，优先保留可安装的 ClawHub Skill；未补全资讯线索 {leads} 条暂不进入日报。</div></div></div><main class="page-body"><section class="section"><div class="section-header"><div class="section-icon hot">🔥</div><span class="section-label">媒体热点 Skill</span><span class="section-count hot">{len(hot)} 条</span><div class="section-line"></div></div><div class="grid" id="hot-grid"></div></section><section class="section"><div class="section-header"><div class="section-icon aibot">🤖</div><span class="section-label">ai-bot.cn 资讯发现</span><span class="section-count aibot">{len(aibot)} 条</span><div class="section-line"></div></div><div class="grid" id="aibot-grid"></div></section><section class="section"><div class="section-header"><div class="section-icon new">✨</div><span class="section-label">ClawHub 近10天新上线（C端精选）</span><span class="section-count new">{len(newest)} 条</span><div class="section-line"></div></div><div class="grid" id="new-grid"></div></section></main><script>
const DATA={payload};const ICONS={{news:["📰","#fff3e0"],read:["📚","#e8f5e9"],food:["🍜","#fff8e1"],wechat:["💬","#e3f2fd"],video:["🎵","#f3e5f5"],cloud:["☁️","#e3f2fd"],email:["📧","#e8eaf6"],ppt:["📊","#fff3e0"],default:["⚡","#f5f5f5"]}};function esc(v){{return String(v||'').replace(/[&<>"']/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}}[c]));}}function icon(name){{const n=String(name).toLowerCase();if(n.includes('36氪')||n.includes('36kr')||n.includes('头条'))return ICONS.news;if(n.includes('weread')||n.includes('微信读书'))return ICONS.read;if(n.includes('美团')||n.includes('meituan'))return ICONS.food;if(n.includes('微信')||n.includes('wechat'))return ICONS.wechat;if(n.includes('抖音')||n.includes('douyin')||n.includes('music')||n.includes('音乐'))return ICONS.video;if(n.includes('drive')||n.includes('网盘'))return ICONS.cloud;if(n.includes('email')||n.includes('邮件'))return ICONS.email;if(n.includes('ppt')||n.includes('slide'))return ICONS.ppt;return ICONS.default;}}function card(s,type){{const ic=icon(s.name),badges={{hot:'🔥 媒体热点',aibot:'🤖 ai-bot.cn',new:'✨ 新上线'}},colors={{hot:['#ef4444','#f97316'],aibot:['#6366f1','#8b5cf6'],new:['#10b981','#06b6d4']}}[type],author=s.author&&s.author!=='未知'?`<span class="card-author">by ${{esc(s.author)}}</span>`:'';return `<div class="card"><div class="card-accent" style="--a:${{colors[0]}};--b:${{colors[1]}}"></div><div class="card-body"><div class="card-top"><div class="card-icon" style="background:${{ic[1]}}">${{ic[0]}}</div><div><div class="card-name" title="${{esc(s.name)}}">${{esc(s.name)}}</div><div class="card-meta">${{author}}<span class="badge ${{type}}">${{badges[type]}}</span></div></div></div><div class="card-summary">${{esc(s.summary||'暂无')}}</div><div class="card-reason">💡 ${{esc(s.reason)}}</div></div><div class="card-footer"><span class="card-source">${{esc(s.source)}}</span><a class="install-btn" href="${{esc(s.install_url)}}" target="_blank" rel="noopener noreferrer">安装</a></div></div>`;}}function render(id,items,type){{const grid=document.getElementById(id);items.forEach(s=>{{const el=document.createElement('div');el.innerHTML=card(s,type);grid.appendChild(el.firstElementChild);}});}}render('hot-grid',DATA.hot,'hot');render('aibot-grid',DATA.aibot,'aibot');render('new-grid',DATA.new,'new');
</script></body></html>'''


def write_html(output_dir: Path, today: str, items: list[dict]) -> Path:
    hot, aibot, newest, leads = report_groups(items)
    path = output_dir / f"skill_report_{today}.html"
    path.write_text(page_shell(today, hot, aibot, newest, leads), encoding="utf-8")
    return path


def run(args: argparse.Namespace) -> None:
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    if args.input_json:
        data = json.loads(Path(args.input_json).read_text(encoding="utf-8"))
        match = re.search(r"(\d{4}-\d{2}-\d{2})", Path(args.input_json).name)
        date = args.date or (match.group(1) if match else str(dt.date.today()))
        html_path = write_html(output_dir, date, data["items"])
        print(json.dumps({"html": str(html_path), "items": len(data["items"])}, ensure_ascii=False, indent=2))
        return
    today = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    news = collect_news_results()
    aibot = collect_ai_bot_results()
    newest, skipped = clawhub_newest(today, days=args.days)
    items, unconfirmed = build_results(news + aibot, newest)
    diagnostics = {"bing_results": len(news), "ai_bot_hits": len(aibot), "clawhub_newest_kept": len(newest), "clawhub_newest_skipped": skipped, "unconfirmed_news_leads": unconfirmed, "final_results": len(items)}
    json_path = write_json_and_text(output_dir, today, items, diagnostics)
    html_path = write_html(output_dir, str(today), items)
    print(json.dumps({"json": str(json_path), "html": str(html_path), **diagnostics}, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Tianxi Claw Skill monitoring reports.")
    parser.add_argument("--output-dir", default=".", help="Directory for JSON/TXT/HTML outputs.")
    parser.add_argument("--date", help="Report date in YYYY-MM-DD. Defaults to today.")
    parser.add_argument("--days", type=int, default=10, help="Recent ClawHub window in days.")
    parser.add_argument("--input-json", help="Existing skill_discovery JSON to render.")
    parser.add_argument("--html-only", action="store_true", help="Compatibility flag; rendering from --input-json is always HTML-only.")
    return parser.parse_args()


if __name__ == "__main__":
    run(parse_args())
