from abc import ABC, abstractmethod
import json
import logging

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self, prompt: str, system_prompt: str = None, temperature: float = 0.7
    ) -> str:
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(
        self, api_key: str = None, model: str = "gpt-3.5-turbo", timeout: float = 60.0
    ):
        try:
            import openai

            self.client = openai.AsyncOpenAI(api_key=api_key, timeout=timeout)
        except ImportError:
            raise RuntimeError("openai package is not installed. Run `pip install openai`")
        self.model = model

    async def generate(
        self, prompt: str, system_prompt: str = None, temperature: float = 0.7
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
        )
        return response.choices[0].message.content


class HuggingFaceProvider(BaseLLMProvider):
    def __init__(
        self,
        token: str = None,
        model: str = "meta-llama/Meta-Llama-3-8B-Instruct",
        timeout: float = 60.0,
    ):
        try:
            from huggingface_hub import AsyncInferenceClient

            self.client = AsyncInferenceClient(token=token, model=model, timeout=timeout)
        except ImportError:
            raise RuntimeError(
                "huggingface_hub package is not installed. Run `pip install huggingface-hub`"
            )

    async def generate(
        self, prompt: str, system_prompt: str = None, temperature: float = 0.7
    ) -> str:
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        response = await self.client.text_generation(
            full_prompt,
            temperature=temperature,
            max_new_tokens=1024,
            return_full_text=False,
        )
        return response


class MockLLMProvider(BaseLLMProvider):
    async def generate(
        self, prompt: str, system_prompt: str = None, temperature: float = 0.7
    ) -> str:
        if (
            "summary" in prompt.lower()
            or "summarize" in prompt.lower()
            or "tldr" in prompt.lower()
        ):
            mock_summary = {
                "tldr": "[DEMO MODE - not a real AI answer] This research paper presents a novel approach utilizing deep learning and Retrieval-Augmented Generation for semantic document analysis and knowledge synthesis.",
                "research_objective": "[DEMO MODE] To develop an accurate, scalable framework for research paper comprehension and retrieval.",
                "problem_statement": "[DEMO MODE] Traditional keyword search and naive summaries fail to capture intricate multi-faceted scholarly arguments.",
                "methodology": "[DEMO MODE] The authors employ recursive chunking with dense vector embeddings and cross-attention ranking.",
                "dataset": "[DEMO MODE] Evaluated on a comprehensive corpus of 10,000 peer-reviewed computer science and biomedical papers.",
                "key_findings": "[DEMO MODE] The proposed architecture outperforms baseline semantic search by 28% in MRR and generates citations with 94% precision.",
                "results": "[DEMO MODE] Achieved state-of-the-art results on ROUGE-L (0.48) and factual consistency benchmarks.",
                "limitations": "[DEMO MODE] Computational overhead during dense vector indexing of large multi-volume monographs.",
                "conclusion": "[DEMO MODE] The framework successfully accelerates literature reviews while preserving rigorous contextual fidelity.",
                "future_scope": "[DEMO MODE] Extending the model to multi-modal figures, equations, and cross-lingual translation.",
                "key_contributions": [
                    "[DEMO MODE] Novel contextual chunking mechanism preserving cross-section coherence",
                    "[DEMO MODE] High-precision citation attribution model with page-level granularity",
                    "[DEMO MODE] Benchmark evaluation demonstrating 28% retrieval accuracy improvements",
                ],
                "keywords": [
                    "Retrieval-Augmented Generation",
                    "Transformers",
                    "Semantic Search",
                    "NLP",
                    "Literature Review",
                ],
            }
            return json.dumps(mock_summary)

        return (
            "[DEMO MODE - not a real AI answer] Based on the provided research context, "
            "the paper establishes that attention mechanisms with retrieval augmentation "
            "significantly reduce hallucination and enhance literature synthesis. "
            "[Source: Research Paper, Page 4]"
        )


_provider_cache = {}


def get_llm_provider(provider: str = "mock", **kwargs) -> BaseLLMProvider:
    cache_key = (
        provider,
        kwargs.get("api_key"),
        kwargs.get("token"),
        kwargs.get("model"),
    )
    if cache_key not in _provider_cache:
        if provider == "openai":
            _provider_cache[cache_key] = OpenAIProvider(
                api_key=kwargs.get("api_key"),
                model=kwargs.get("model", "gpt-3.5-turbo"),
            )
        elif provider == "huggingface":
            _provider_cache[cache_key] = HuggingFaceProvider(
                token=kwargs.get("token"),
                model=kwargs.get("model", "meta-llama/Meta-Llama-3-8B-Instruct"),
            )
        else:
            _provider_cache[cache_key] = MockLLMProvider()
    return _provider_cache[cache_key]
