import os
import asyncio
from dotenv import load_dotenv
from typing import TypeVar
from pydantic import BaseModel

from portia import (
    Config,
    DefaultToolRegistry,
    Portia,
    StorageClass,
    LLMProvider,
    GenerativeModel,
    Message,
    open_source_tool_registry,
)
from portia.cli import CLIExecutionHooks
from langchain_groq import ChatGroq
from langchain_core.language_models.chat_models import BaseChatModel


load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')


task0 = "give labels to this issue #1 from reading it title and body of github repository dhruvdankhara/testing-portia"

my_config = Config.from_default(
    storage_class=StorageClass.CLOUD,
    # default_model=GroqGenerativeModel(
    #     model_name="llama-3.1-8b-instant",   # Groq model name you want
    #     api_key=GROQ_API_KEY  # ensure this env var is set
    # )
    # llm_provider=LLMProvider.MISTRALAI,
    # mistralai_api_key=MISTRAL_API_KEY,
    # default_model="mistralai/mistral-medium-latest",
    llm_provider=LLMProvider.GOOGLE,
    google_api_key=GOOGLE_API_KEY,
    default_model="google/gemini-2.5-flash",
    planning_model="google/gemini-2.5-flash"
)

portia = Portia(
    config=my_config,
    tools=DefaultToolRegistry(my_config) ,
    execution_hooks=CLIExecutionHooks(),
)


