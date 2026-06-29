from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    upstage_api_key: str = ""
    data_file_path: str = "data/expenses.json"
    upload_dir: str = "uploads"

    model_config = {"env_file": ".env"}


settings = Settings()
