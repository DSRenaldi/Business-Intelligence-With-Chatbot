import os
from functools import lru_cache
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM
from transformers import AutoTokenizer


ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = ROOT_DIR / "models" / "Qwen3-4B-Instruct-2507"


@lru_cache(maxsize=1)
def get_model_bundle():
    model_path = os.getenv("QWEN_MODEL_PATH", str(DEFAULT_MODEL_PATH))
    torch_dtype = torch.float16 if torch.cuda.is_available() else "auto"

    if torch.cuda.is_available():
        torch.backends.cuda.matmul.allow_tf32 = True

    tokenizer = AutoTokenizer.from_pretrained(
        model_path,
        trust_remote_code=True,
    )

    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch_dtype,
        device_map="auto",
        low_cpu_mem_usage=True,
        trust_remote_code=True,
    )

    model.eval()

    return tokenizer, model


def get_runtime_info():
    return {
        "model_path": os.getenv("QWEN_MODEL_PATH", str(DEFAULT_MODEL_PATH)),
        "cuda_available": torch.cuda.is_available(),
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    }
