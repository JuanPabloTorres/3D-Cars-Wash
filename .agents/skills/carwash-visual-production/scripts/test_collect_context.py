"""Exercise collector boundaries in an isolated fixture, not the live product."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import collect_context


class ContextBoundaries(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix="carwash-context-test-")
        self.addCleanup(self.scratch.cleanup)
        self.base = Path(self.scratch.name).resolve()
        self.project = self.base / "project"
        (self.project / "src/world").mkdir(parents=True)
        (self.project / "src/world/WorldScene.tsx").write_text("fixture", encoding="utf-8")
        (self.project / "package.json").write_text('{"scripts":{"test":"fixture"}}', encoding="utf-8")
        self.script = Path(collect_context.__file__).resolve()

    def run_collector(self, output, project=None):
        return subprocess.run(
            [sys.executable, str(self.script), "--project", str(project or self.project),
             "--references", str(self.base / "absent-references"), "--output", str(output)],
            capture_output=True, text=True, check=False,
        )

    def test_existing_evidence_is_preserved(self):
        output = self.base / "existing.json"
        output.write_text("original evidence", encoding="utf-8")
        result = self.run_collector(output)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(output.read_text(), "original evidence")

    def test_product_destination_is_rejected(self):
        output = self.project / "src/new-report.json"
        self.assertEqual(self.run_collector(output).returncode, 1)
        self.assertFalse(output.exists())

    def test_invalid_project_does_not_produce_a_report(self):
        output = self.base / "invalid.json"
        self.assertEqual(self.run_collector(output, self.base).returncode, 1)
        self.assertFalse(output.exists())

    def test_missing_inputs_are_explicit_and_sources_unchanged(self):
        source = self.project / "src/world/WorldScene.tsx"
        original = source.read_bytes()
        output = self.project / "docs/evidence/context.json"
        result = self.run_collector(output)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(output.read_text(encoding="utf-8"))
        self.assertEqual(len(report["references"]), 5)
        self.assertTrue(all(r["status"] == "missing" for r in report["references"]))
        self.assertEqual(source.read_bytes(), original)
        self.assertIn("browser", report["checksNotRun"])


if __name__ == "__main__":
    unittest.main()
