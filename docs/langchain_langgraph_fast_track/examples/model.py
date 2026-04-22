from langchain.chat_models import init_chat_model

llm = init_chat_model(
    model_provider="openai",
    model="qwen3.5-9b-mlx",
    base_url="http://192.168.0.27:1234/v1",
    api_key="dontcare"
)
