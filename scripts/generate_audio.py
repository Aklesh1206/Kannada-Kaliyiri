"""
Makes one mp3 per phrase into public/audio/<phrase id>.mp3 using Microsoft's free Kannada voices.

Setup (once):   pip install edge-tts
Run:            python scripts/generate_audio.py
Re-run any time you add phrases. Files that already exist are skipped, use --force to redo them.
Pick the other voice with --voice kn-IN-GaganNeural (male). Default is kn-IN-SapnaNeural (female).
"""
import argparse
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
UNITS = ROOT / "content" / "units"
OUT = ROOT / "public" / "audio"


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default="kn-IN-SapnaNeural")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    made = skipped = 0
    for unit_file in sorted(UNITS.glob("*.json")):
        unit = json.loads(unit_file.read_text(encoding="utf-8"))
        for phrase in unit["phrases"]:
            target = OUT / f"{phrase['id']}.mp3"
            if target.exists() and not args.force:
                skipped += 1
                continue
            # Speak the Kannada script. The Roman spelling would be read with English pronunciation.
            await edge_tts.Communicate(phrase["kn"], args.voice, rate="-10%").save(str(target))
            print(f"made {target.name}  {phrase['kn']}")
            made += 1
    print(f"done: {made} made, {skipped} skipped")


if __name__ == "__main__":
    asyncio.run(main())
