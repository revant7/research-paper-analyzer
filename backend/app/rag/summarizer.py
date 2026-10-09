import json
import logging
from typing import List, Dict, Any
from .llm_provider import BaseLLMProvider

logger = logging.getLogger(__name__)


class PaperSummarizer:
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm_provider = llm_provider

    def _split_into_chunks(self, text: str, max_chunk_chars: int = 12000) -> List[str]:
        if len(text) <= max_chunk_chars:
            return [text]
        
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + max_chunk_chars, len(text))
            # Try to break on paragraph or sentence boundary
            if end < len(text):
                last_newline = text.rfind("\n\n", start, end)
                if last_newline != -1 and last_newline > start + max_chunk_chars // 2:
                    end = last_newline
                else:
                    last_period = text.rfind(". ", start, end)
                    if last_period != -1 and last_period > start + max_chunk_chars // 2:
                        end = last_period + 1
            chunk_slice = text[start:end].strip()
            if chunk_slice:
                chunks.append(chunk_slice)
            start = end
        return chunks if chunks else [text]

    async def _map_chunk(self, chunk: str, index: int, total: int) -> str:
        system_prompt = (
            "You are an expert research analyst. Summarize this section of an academic research paper. "
            "Extract the core objectives, methodology, experiments, data, numerical results, and key conclusions."
        )
        prompt = f"Section {index + 1} of {total} from research paper:\n\n{chunk}"
        return await self.llm_provider.generate(prompt=prompt, system_prompt=system_prompt)

    async def summarize(self, text: str, metadata: dict = None) -> dict:
        meta_info = ""
        if metadata:
            title = metadata.get("title") or "Unknown"
            authors = metadata.get("authors") or "Unknown"
            meta_info = f"Paper Title: {title}\nAuthors: {authors}\n\n"

        chunks = self._split_into_chunks(text, max_chunk_chars=12000)
        
        if len(chunks) == 1:
            intermediate_content = chunks[0]
        else:
            # Map step: summarize each chunk
            logger.info(f"Running Map-Reduce summarization across {len(chunks)} chunks")
            chunk_summaries = []
            for i, chunk in enumerate(chunks):
                chunk_sum = await self._map_chunk(chunk, i, len(chunks))
                chunk_summaries.append(f"--- Section {i+1} Summary ---\n{chunk_sum}")
            intermediate_content = "\n\n".join(chunk_summaries)

        # Reduce step: produce structured JSON summary
        system_prompt = """You are an expert research assistant. Read the provided research paper content and generate a comprehensive, structured summary.
Your response MUST be valid JSON with EXACTLY these keys:
- tldr: string (3-5 sentences summarizing the core problem, approach, and principal achievement)
- research_objective: string
- problem_statement: string
- methodology: string
- dataset: string
- key_findings: string
- results: string
- limitations: string
- conclusion: string
- future_scope: string
- key_contributions: list of strings
- keywords: list of strings

Output ONLY the JSON object, with no markdown code fences or extra text."""

        reduce_prompt = f"{meta_info}Summarized content of paper:\n\n{intermediate_content}"

        try:
            response = await self.llm_provider.generate(prompt=reduce_prompt, system_prompt=system_prompt)
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]

            parsed = json.loads(response.strip())
            return {
                "tldr": str(parsed.get("tldr", "")),
                "research_objective": str(parsed.get("research_objective", "")),
                "problem_statement": str(parsed.get("problem_statement", "")),
                "methodology": str(parsed.get("methodology", "")),
                "dataset": str(parsed.get("dataset", "")),
                "key_findings": str(parsed.get("key_findings", "")),
                "results": str(parsed.get("results", "")),
                "limitations": str(parsed.get("limitations", "")),
                "conclusion": str(parsed.get("conclusion", "")),
                "future_scope": str(parsed.get("future_scope", "")),
                "key_contributions": parsed.get("key_contributions") if isinstance(parsed.get("key_contributions"), list) else [],
                "keywords": parsed.get("keywords") if isinstance(parsed.get("keywords"), list) else []
            }
        except Exception as e:
            logger.exception(f"Failed to generate summary: {e}")
            raise RuntimeError("Summary generation failed: could not parse model response")
