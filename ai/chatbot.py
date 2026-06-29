import os

import torch

from ai.model_loader import get_model_bundle
from ai.prompt_builder import build_messages


def generate_chat_response(user_message, business_context_text):
    tokenizer, model = get_model_bundle()
    max_new_tokens = int(os.getenv("QWEN_MAX_NEW_TOKENS", "96"))
    messages = build_messages(user_message, business_context_text)

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(
        [prompt],
        return_tensors="pt",
    ).to(model.device)

    with torch.inference_mode():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            use_cache=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_ids = output_ids[0][inputs.input_ids.shape[-1]:]

    return tokenizer.decode(
        generated_ids,
        skip_special_tokens=True,
    ).strip()
