# Nexus BI Copilot Fine-Tuning

This folder contains supervised examples for:

- BI question to structured intent plan
- Analytics result to executive BI answer

The model must learn BI planning and answer style only. PostgreSQL remains the source of truth for live metrics.

## Install dependency

```powershell
.\.venv\Scripts\python.exe -m pip install peft
```

## Validate dataset

```powershell
.\.venv\Scripts\python.exe training\train_bi_copilot_lora.py --dry-run
```

## Train LoRA adapter

```powershell
.\.venv\Scripts\python.exe training\train_bi_copilot_lora.py
```

Output adapter:

```text
models/bi-copilot-qwen-lora
```

Note: Qwen3-4B LoRA training may still be heavy on RTX 3050 Laptop GPU. If VRAM is insufficient, use a smaller model for planner/narrator or switch to a quantized training setup.

## Current local hardware result

On RTX 3050 Laptop GPU + 16GB RAM, a 1-step LoRA test for Qwen3-4B loaded with CPU offload failed during backward because some layers were on `meta`/CPU while gradients were on CUDA.

That means full Qwen3-4B LoRA training is not reliable on this machine with standard Transformers + PEFT FP16.

Recommended next options:

1. Train a smaller planner model.
2. Use QLoRA on a Linux/CUDA environment with bitsandbytes.
3. Train on cloud GPU, then copy the LoRA adapter into `models/bi-copilot-qwen-lora`.
4. Use the examples as few-shot planner guidance locally until adapter training is available.
