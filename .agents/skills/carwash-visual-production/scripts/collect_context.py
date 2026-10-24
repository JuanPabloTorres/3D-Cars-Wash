"""Collect a bounded, read-only project context; write only a new requested report.

Hashes identify inspected files, not technical or artistic acceptance. Private
configuration is excluded by selecting public source files rather than walking
the whole server directory. No shell commands, Blender or network are invoked.
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


REFERENCES = (
    "Febles Car Wash entrance UI concept-1.png",
    "Polished car wash service catalog-2.png",
    "Febles Car Wash Reception Concept-3.png",
    "Polished Car Wash Operations UI-4.png",
    "Febles Car Wash Lounge UI-5.png",
)
OWNERS = (
    "AGENTS.md", "package.json", "package-lock.json", "playwright.config.ts",
    "src/app/App.tsx", "src/app/store.ts", "src/app/commerceStore.ts",
    "src/world/WorldScene.tsx", "src/world/WorldLayout.tsx",
    "src/world/siteLandscape.ts", "src/world/prefabs/Landscape.tsx",
    "src/world/prefabs/EntranceForecourt.tsx", "src/world/prefabs/LoungePrefab.tsx",
    "src/world/navigation/CameraController.tsx", "src/world/navigation/layout.ts",
    "src/world/prefabs/Architecture.tsx", "src/world/prefabs/CounterObjects.tsx",
    "src/world/prefabs/StaffPrefab.tsx", "src/world/prefabs/VehicleAppearance.tsx",
    "src/world/prefabs/ServiceActivityVisualizer.tsx",
    "src/world/animation/NPCAnimationController.ts", "src/world/assets/registry.ts",
    "src/ui/WorldHUD.tsx", "src/ui/WorldOverlayManager.tsx",
    "src/ui/world.css", "src/ui/sow.css", "src/reception/ReceptionDialogue.tsx",
    "src/domain/sitePlan.ts", "src/domain/DemoOperationSource.ts",
    "src/domain/DemoOperationTransport.ts", "src/domain/OperationProjection.ts",
    "server/demoApi.ts", "server/configuration.ts",
    "scripts/export-staff.py", "scripts/prepare-sow-receptionist.mjs",
    "scripts/optimize-staff.mjs", "scripts/prepare-innerscene-vehicles.py",
    "scripts/capture-revision-final.mjs", "scripts/validate-assets.mjs",
    "tests/e2e/commercial.spec.ts", "tests/e2e/sow.spec.ts", "tests/e2e/lounge.spec.ts",
    "docs/ASSET_INVENTORY.md", "public/ASSET_LICENSES.txt",
    "docs/design/visual-experience-sow.md", "docs/design/reference-reconciliation.md",
)


def identify(path, label):
    """Return safe file identity and PNG dimensions; do not return contents."""
    if not path.is_file():
        return {"file": label, "status": "missing"}
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        header = stream.read(24)
        digest.update(header)
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    result = {"file": label, "status": "present", "bytes": path.stat().st_size,
              "sha256": digest.hexdigest()}
    if header.startswith(b"\x89PNG\r\n\x1a\n") and len(header) >= 24:
        result["pixels"] = {"width": int.from_bytes(header[16:20], "big"),
                            "height": int.from_bytes(header[20:24], "big")}
    return result


def collect(project, references):
    """Identify known owners/assets and executable commands without running them."""
    if not (project / "src/world/WorldScene.tsx").is_file():
        raise ValueError("Expected existing CarWash Three.js repository; no files changed")
    package = json.loads((project / "package.json").read_text(encoding="utf-8-sig"))
    owners = []
    for relative in OWNERS:
        candidate = (project / relative).resolve()
        if not candidate.is_relative_to(project):
            raise ValueError("Owner symlink escapes project: " + relative)
        owners.append(identify(candidate, relative))
    models = []
    for candidate in sorted((project / "public/models").glob("*.glb")):
        if not candidate.resolve().is_relative_to(project):
            raise ValueError("Model symlink escapes project")
        models.append(identify(candidate, candidate.relative_to(project).as_posix()))
    agents = []
    for candidate in sorted((project / ".codex/agents").glob("carwash_*.toml")):
        if not candidate.resolve().is_relative_to(project):
            raise ValueError("Agent symlink escapes project")
        agents.append(identify(candidate, candidate.relative_to(project).as_posix()))
    return {
        "observedAt": datetime.now(timezone.utc).isoformat(),
        "project": project.name,
        "scope": "Static identities only; not execution, quality or acceptance",
        "commandsAvailable": package.get("scripts", {}),
        "dependencies": package.get("dependencies", {}),
        "owners": owners, "models": models, "agents": agents,
        "references": [identify(references / name, name) for name in REFERENCES],
        "checksNotRun": ["browser", "Blender live", "unit/E2E/build", "artistic acceptance"],
        "privacy": "No env files, credentials, local overrides, sessions or private orders read",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--references", type=Path, default=Path.home() / "Downloads")
    parser.add_argument("--output", required=True, type=Path)
    options = parser.parse_args()
    try:
        project = options.project.resolve(strict=True)
        output = options.output.resolve()
        if output.exists():
            raise FileExistsError("Report exists; use a new attempt filename")
        # Keep report writes outside live code/assets/config and original sources.
        if output.is_relative_to(project) and not output.is_relative_to(project / "docs/evidence"):
            raise ValueError("Inside repository, reports must be in docs/evidence")
        if output.is_relative_to(options.references.resolve()):
            raise ValueError("Do not write reports inside original references")
        if output.suffix.lower() != ".json":
            raise ValueError("Report must use .json extension")
        result = collect(project, options.references.resolve())
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("x", encoding="utf-8") as stream:
            json.dump(result, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        missing = sum(item["status"] == "missing" for item in result["owners"])
        print(json.dumps({"report": str(output), "owners": len(result["owners"]),
                          "missingOwners": missing, "models": len(result["models"]),
                          "referencesFound": sum(r["status"] == "present" for r in result["references"])}))
    except (OSError, ValueError) as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
