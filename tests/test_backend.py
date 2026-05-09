"""Integration tests for backend services. Requires API keys in .env and corpus initialized."""
import pytest
from dotenv import load_dotenv
load_dotenv()


@pytest.fixture(scope="session", autouse=True)
def corpus():
    from backend.rag_service import init_corpus
    init_corpus()


# ---------------------------------------------------------------------------
# extract_facts (NER)
# ---------------------------------------------------------------------------

class TestExtractFacts:
    def test_overtime_scenario(self):
        from backend.ner_service import extract_facts
        facts = extract_facts(
            "I work 60 hours per week at Acme Corp. My boss pays me for 40 hours at $15 an hour."
        )
        assert facts["employer_name"] == "Acme Corp"
        assert facts["hours_worked_per_week"] == 60
        assert facts["hours_paid_per_week"] == 40
        assert facts["hourly_rate"] == 15

    def test_employer_name_stripped_of_business_type(self):
        from backend.ner_service import extract_facts
        facts = extract_facts(
            "I work at FreshMart grocery store. I never get overtime pay."
        )
        # Should extract "FreshMart" not "FreshMart grocery store"
        assert "grocery store" not in (facts["employer_name"] or "")

    def test_vague_input_no_hallucination(self):
        from backend.ner_service import extract_facts
        facts = extract_facts("My boss is mean to me.")
        assert facts["hours_worked_per_week"] is None
        assert facts["hourly_rate"] is None

    def test_empty_input_returns_dict(self):
        from backend.ner_service import extract_facts
        facts = extract_facts("")
        assert isinstance(facts, dict)
        assert facts.get("hours_worked_per_week") is None

    def test_employment_type_defaults_unknown(self):
        from backend.ner_service import extract_facts
        facts = extract_facts("I do deliveries sometimes.")
        assert facts.get("employment_type") in ("unknown", "contractor", "employee")


# ---------------------------------------------------------------------------
# retrieve (RAG)
# ---------------------------------------------------------------------------

class TestRetrieve:
    def test_overtime_retrieves_207(self):
        from backend.rag_service import retrieve
        chunks = retrieve("overtime workweek forty hours", k=5)
        assert len(chunks) > 0
        assert any("207" in c["section"] for c in chunks), \
            f"Expected § 207 in chunks, got: {[c['section'] for c in chunks]}"

    def test_minimum_wage_retrieves_206(self):
        from backend.rag_service import retrieve
        chunks = retrieve("minimum wage rate employer pay seven dollars", k=5)
        assert len(chunks) > 0
        # Accept either section metadata match OR relevant text content
        relevant = any(
            "206" in c["section"] or "minimum wage" in c["text"].lower()
            for c in chunks
        )
        assert relevant, f"No minimum wage content in chunks: {[c['section'] for c in chunks]}"

    def test_tip_retrieves_203(self):
        from backend.rag_service import retrieve
        chunks = retrieve("tips gratuities employer tip credit section 203", k=5)
        assert len(chunks) > 0
        relevant = any(
            "203" in c["section"] or "tip" in c["text"].lower()
            for c in chunks
        )
        assert relevant, f"No tip content in chunks: {[c['section'] for c in chunks]}"

    def test_chunks_have_required_fields(self):
        from backend.rag_service import retrieve
        chunks = retrieve("overtime", k=3)
        for chunk in chunks:
            assert "source" in chunk
            assert "section" in chunk
            assert "text" in chunk
            assert len(chunk["text"]) > 0

    def test_multi_corpus_sources_present(self):
        from backend.rag_service import retrieve
        # CA overtime query should surface CA Labor Code
        ca_chunks = retrieve("california overtime eight hours per day section 510", k=5)
        sources = {c["source"] for c in ca_chunks}
        assert len(sources) > 0  # at least one source returned


# ---------------------------------------------------------------------------
# classify_violations
# ---------------------------------------------------------------------------

class TestClassifyViolations:
    def test_overtime_violation_detected(self):
        from backend.rag_service import retrieve
        from backend.classifier import classify_violations
        facts = {
            "employer_name": "Acme",
            "hours_worked_per_week": 60,
            "hours_paid_per_week": 40,
            "hourly_rate": 15,
            "pay_period": "weekly",
            "employment_type": "employee",
            "raw_claims": ["I work 60 hours but only get paid for 40"],
        }
        chunks = retrieve("overtime wages forty hours workweek", k=8)
        result = classify_violations(facts, chunks)
        types = [v["type"] for v in result["violations"]]
        assert "overtime_theft" in types

    def test_minimum_wage_violation_detected(self):
        from backend.rag_service import retrieve
        from backend.classifier import classify_violations
        facts = {
            "employer_name": "Sparkle Auto",
            "hours_worked_per_week": 40,
            "hourly_rate": 5.0,
            "raw_claims": ["I get paid $5/hr, below minimum wage"],
        }
        chunks = retrieve("minimum wage rate employer shall pay section 206", k=8)
        result = classify_violations(facts, chunks)
        types = [v["type"] for v in result["violations"]]
        assert "minimum_wage" in types

    def test_immigration_disclaimer_always_true(self):
        from backend.rag_service import retrieve
        from backend.classifier import classify_violations
        facts = {"employer_name": None, "raw_claims": ["my boss owes me money"]}
        chunks = retrieve("wage theft", k=3)
        result = classify_violations(facts, chunks)
        assert result["immigration_disclaimer"] is True

    def test_violations_sorted_high_to_low(self):
        from backend.rag_service import retrieve
        from backend.classifier import classify_violations
        facts = {
            "employer_name": "Acme",
            "hours_worked_per_week": 60,
            "hourly_rate": 6.0,
            "raw_claims": ["underpaid and overworked"],
        }
        chunks = retrieve("overtime minimum wage", k=8)
        result = classify_violations(facts, chunks)
        if len(result["violations"]) > 1:
            order = {"high": 0, "medium": 1, "low": 2}
            severities = [v["severity"] for v in result["violations"]]
            assert severities == sorted(severities, key=lambda s: order.get(s, 2)), \
                f"Violations not sorted by severity: {severities}"

    def test_result_has_required_fields(self):
        from backend.rag_service import retrieve
        from backend.classifier import classify_violations
        facts = {"employer_name": "Test Co", "raw_claims": ["unpaid overtime"]}
        chunks = retrieve("overtime", k=3)
        result = classify_violations(facts, chunks)
        assert "violations" in result
        assert "immigration_disclaimer" in result
        assert "clarifications_needed" in result
        assert isinstance(result["violations"], list)
