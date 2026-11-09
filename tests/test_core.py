KEY='events'
import unittest, json, tempfile, copy
from pathlib import Path
from core import validate, analyze
from server import Store, Conflict
SAMPLE=json.loads((Path(__file__).resolve().parents[1]/"examples/sample.json").read_text())
class Tests(unittest.TestCase):
    def fresh(self):return copy.deepcopy(SAMPLE)
    def test_sample_roundtrip(self):
        doc=validate(self.fresh());self.assertEqual(doc,validate(json.loads(json.dumps(doc))));self.assertTrue(analyze(doc)["metrics"])
    def test_invalid_version(self):
        for version in [True,2,"1",None]:
            d=self.fresh();d["version"]=version
            with self.assertRaises(ValueError):validate(d)
    def test_duplicate_identity(self):
        d=self.fresh();d[KEY].append(copy.deepcopy(d[KEY][0]))
        with self.assertRaises(ValueError):validate(d)
    def test_empty_document(self):
        d=self.fresh();d[KEY]=[];self.assertEqual(validate(d)[KEY],[]);analyze(validate(d))
    def test_oversized_collection(self):
        d=self.fresh();d[KEY]=[dict(d[KEY][0],id="x"+str(i)) for i in range(151)]
        with self.assertRaises(ValueError):validate(d)
    def test_storage_revision_and_reopen(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"library.sqlite3";store=Store(path)
            first=store.save({"revision":0,"document":self.fresh()});second=store.save({**first,"document":dict(first["document"],title="Changed")})
            self.assertEqual(second["revision"],2)
            with self.assertRaises(Conflict):store.save(first)
            self.assertEqual(Store(path).get(first["id"])["document"]["title"],"Changed")
    def test_invalid_save_preserves_previous(self):
        with tempfile.TemporaryDirectory() as tmp:
            store=Store(Path(tmp)/"library.sqlite3");first=store.save({"revision":0,"document":self.fresh()})
            with self.assertRaises(ValueError):store.save({**first,"document":{"version":2}})
            self.assertEqual(store.get(first["id"]),first)
    def test_leap_day_and_invalid_date(self):
        d=self.fresh();d["events"][0]["date"]="2024-02-29";validate(d)
        for value in ["2023-02-29","2026-13-01","20260101","1999-12-31"]:
            d["events"][0]["date"]=value
            with self.assertRaises(ValueError):validate(d)
    def test_exclusive_end_and_resource_conflict(self):
        d=self.fresh();a=d["events"][0];a.update(date="2026-12-31",duration=1,repeat="once",count=1);b=dict(a,id="next",date="2027-01-01");d["events"]=[a,b]
        self.assertFalse(analyze(validate(d))["conflicts"])
        b["date"]="2026-12-31";self.assertEqual(len(analyze(validate(d))["conflicts"]),1)
    def test_weekly_cross_year(self):
        d=self.fresh();d["events"]=[dict(d["events"][0],date="2026-12-28",repeat="weekly",count=2)]
        self.assertEqual([e["start"] for e in analyze(validate(d))["occurrences"]],["2026-12-28","2027-01-04"])
    def test_once_normalizes_count(self):
        d=self.fresh();d["events"][0].update(repeat="once",count=52)
        self.assertEqual(validate(d)["events"][0]["count"],1)

    def test_optional_note_normalization(self):
        for value in [None, "", "  Check alignment  "]:
            with self.subTest(value=value):
                d = self.fresh()
                d["events"][0]["note"] = value
                expected = "Check alignment" if value else "—"
                self.assertEqual(validate(d)["events"][0]["note"], expected)
        d = self.fresh()
        d["events"][0].pop("note", None)
        self.assertEqual(validate(d)["events"][0]["note"], "—")

    def test_non_text_note_rejection_preserves_saved_document(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp) / "library.sqlite3")
            first = store.save({"revision": 0, "document": self.fresh()})
            for value in [False, True, 0, 1, [], {}, ["Check alignment"]]:
                with self.subTest(value=value):
                    invalid = copy.deepcopy(first)
                    invalid["document"]["events"][0]["note"] = value
                    with self.assertRaisesRegex(ValueError, "Note"):
                        store.save(invalid)
                    self.assertEqual(store.get(first["id"]), first)
            retry = copy.deepcopy(first)
            retry["document"]["events"][0]["note"] = "Check alignment"
            saved = store.save(retry)
            self.assertEqual(saved["revision"], 2)
            self.assertEqual(Store(store.path).get(first["id"]), saved)

if __name__=="__main__":unittest.main()
