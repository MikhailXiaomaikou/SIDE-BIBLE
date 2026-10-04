#!/usr/bin/env python3
"""Build SIDE BIBLE's offline fonts from pinned, official OFL originals.

Requires fontTools and brotli. Run with --download once to fetch missing originals;
subsequent runs need no network. Original TTF files stay in ignored artifacts/.
"""

import argparse
import hashlib
import json
from pathlib import Path
import unicodedata
import urllib.request

from fontTools import __version__ as fonttools_version
from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
GOOGLE_REV = "9710da1eacb3be272583c3224dcb70f9da6eadbb"
WENKAI_REV = "8bd6319350fb3ae1904c1cb1a41595ab15d21140"
SOURCES = (
    {
        "id": "xing", "family": "Side Xing", "original": "ZhiMangXing-Regular.ttf",
        "upstream": "Zhi Mang Xing", "commit": GOOGLE_REV,
        "url": f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_REV}/ofl/zhimangxing/ZhiMangXing-Regular.ttf",
        "sha256": "644e0cae9b40f0b10ab729a01bd32032e3973bac22be3dccae01bf6ae7fde969",
        "license": "OFL-ZhiMangXing.txt",
        "license_url": f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_REV}/ofl/zhimangxing/OFL.txt",
        "license_sha256": "10947328199e369a3e6b4a67e8e5507ed99d5bbb264a1f156415aa9b665e4d15",
    },
    {
        "id": "brush", "family": "Side Brush", "original": "MaShanZheng-Regular.ttf",
        "upstream": "Ma Shan Zheng", "commit": GOOGLE_REV,
        "url": f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_REV}/ofl/mashanzheng/MaShanZheng-Regular.ttf",
        "sha256": "6d2546bb189c732a8ca29af9e22457b152387d158aa459e4ac2ce1e51788b7fb",
        "license": "OFL-MaShanZheng.txt",
        "license_url": f"https://raw.githubusercontent.com/google/fonts/{GOOGLE_REV}/ofl/mashanzheng/OFL.txt",
        "license_sha256": "d7bdb1cee215b689e23c2f95672a6084c790542170648267a55114103d756a08",
    },
    {
        "id": "kai", "family": "Side Kai", "original": "LXGWWenKai-Regular.ttf",
        "upstream": "LXGW WenKai", "commit": WENKAI_REV,
        "url": f"https://raw.githubusercontent.com/lxgw/LxgwWenKai/{WENKAI_REV}/fonts/TTF/LXGWWenKai-Regular.ttf",
        "sha256": "39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009",
        "license": "OFL-LXGWWenKai.txt",
        "license_url": f"https://raw.githubusercontent.com/lxgw/LxgwWenKai/{WENKAI_REV}/OFL.txt",
        "license_sha256": "1a25e35da1031c6c3436fde545bb9cb5aca954e9873afe510c834b8b79bd21a0",
    },
)
DEFAULT_INPUTS = ("src/content.js", "src/index.html", "src/main.js")
EXTRA_TEXT = (
    "旁经 SIDE BIBLE 正典之外 十二部古卷 七十二幕故事 按住画面让古卷苏醒 "
    "继续上次阅读 轻点翻页 松手成章 书卷 拾页 原典 声音 说明 归于寂静 已拾得 "
    "全部 远古与异象 智慧与拯救 福音之外 静谧模式 暂停持续动画 "
    "，。！？；：、‘’“”（）【】《》〈〉「」『』〔〕—–…·／－％＋＝"
)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def is_cjk(codepoint):
    return any(start <= codepoint <= end for start, end in (
        (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF),
        (0x20000, 0x323AF),
    ))


def ensure_asset(path, url, expected_hash, download):
    if not path.exists():
        if not download:
            raise SystemExit(f"Missing {path}. Run again with --download.")
        request = urllib.request.Request(url, headers={"User-Agent": "Side-Bible-font-build"})
        data = urllib.request.urlopen(request, timeout=60).read()
        if hashlib.sha256(data).hexdigest() != expected_hash:
            raise SystemExit(f"Downloaded source checksum mismatch: {url}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    if sha256(path) != expected_hash:
        raise SystemExit(f"Source checksum mismatch: {path}")


def rename_subset(font, family):
    """Give modified fonts their own primary names; retain original attribution."""
    names = font["name"]
    postscript = family.replace(" ", "") + "-Regular"
    values = {
        1: family, 2: "Regular", 3: f"SIDE BIBLE;{postscript};subset-v1",
        4: family + " Regular", 6: postscript, 16: family, 17: "Regular",
        18: family + " Regular", 21: family, 22: "Regular",
    }
    platforms = {(n.platformID, n.platEncID, n.langID) for n in names.names}
    platforms.add((3, 1, 0x409))
    for platform, encoding, language in platforms:
        for name_id, value in values.items():
            names.setName(value, name_id, platform, encoding, language)


def describe_codepoints(codepoints):
    return [{"character": chr(cp), "codepoint": f"U+{cp:04X}"} for cp in sorted(codepoints)]


def build(args):
    inputs = [Path(p).resolve() for p in args.input] if args.input else [ROOT / p for p in DEFAULT_INPUTS]
    corpus = EXTRA_TEXT + "".join(path.read_text(encoding="utf-8") for path in inputs)
    required = {ord(c) for c in corpus if unicodedata.category(c) != "Cc"}
    required.update(range(0x20, 0x7F))
    required_cjk = {cp for cp in required if is_cjk(cp)}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "format": 1,
        "fonttools_version": fonttools_version,
        "input_files": [{"path": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path), "sha256": sha256(path)} for path in inputs],
        "extra_text": EXTRA_TEXT,
        "required_codepoints": len(required),
        "required_cjk_codepoints": len(required_cjk),
        "subset_policy": "All source-file characters, printable ASCII, UI seed and punctuation; retain applicable GSUB/GPOS closure and Unicode variation sequences.",
        "fonts": [],
    }
    for source in SOURCES:
        original = args.originals_dir / source["original"]
        license_path = args.output_dir / source["license"]
        ensure_asset(original, source["url"], source["sha256"], args.download)
        ensure_asset(license_path, source["license_url"], source["license_sha256"], args.download)
        font = TTFont(original, recalcTimestamp=False)
        missing_source_cjk = required_cjk - set(font.getBestCmap())
        if missing_source_cjk:
            raise SystemExit(f"{source['upstream']} cannot cover CJK: {describe_codepoints(missing_source_cjk)}")
        # Include selectors for retained base characters so existing glyph variants
        # and punctuation variants survive fontTools' closure, without inventing new glyphs.
        selectors = {selector for table in font["cmap"].tables if table.format == 14 for selector in table.uvsDict}
        options = subset.Options()
        options.flavor = "woff2"
        options.hinting = False
        options.layout_features = ["*"]
        options.layout_closure = True
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        options.notdef_glyph = True
        options.notdef_outline = True
        options.recommended_glyphs = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=sorted(required | selectors))
        subsetter.subset(font)
        rename_subset(font, source["family"])
        font.flavor = "woff2"
        destination = args.output_dir / f"side-{source['id']}.woff2"
        font.save(destination)
        font.close()
        result = TTFont(destination)
        cmap = set(result.getBestCmap())
        missing_cjk = required_cjk - cmap
        if missing_cjk:
            raise SystemExit(f"Subset lost required CJK: {destination}")
        record = {
            **source,
            "output": destination.name,
            "output_sha256": sha256(destination),
            "output_bytes": destination.stat().st_size,
            "unicode_entries": len(cmap),
            "glyphs": len(result.getGlyphOrder()),
            "missing_cjk_count": len(missing_cjk),
            "missing_other_characters": describe_codepoints(required - cmap - required_cjk),
            "variation_selectors": describe_codepoints({selector for table in result["cmap"].tables if table.format == 14 for selector in table.uvsDict}),
        }
        result.close()
        manifest["fonts"].append(record)
        print(f"{destination.name}: {record['output_bytes']:,} bytes; {len(required_cjk)} CJK required; {len(missing_cjk)} CJK missing")
    manifest["total_woff2_bytes"] = sum(font["output_bytes"] for font in manifest["fonts"])
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Total WOFF2: {manifest['total_woff2_bytes']:,} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Fetch absent pinned official sources; existing assets are always hash-checked.")
    parser.add_argument("--originals-dir", type=Path, default=ROOT / "artifacts/fonts")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "src/fonts")
    parser.add_argument("--input", action="append", help="Override corpus files; repeat for every input. Defaults to content.js, index.html, main.js.")
    build(parser.parse_args())


if __name__ == "__main__":
    main()
