from langchain.chat_models import init_chat_model
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "너는 친절한 한국어 비서야. 간결하게 답해."),
        ("placeholder", "{messages}"),
    ]
)

model = init_chat_model("anthropic:claude-sonnet-4-6")

chain = prompt | model | StrOutputParser()
