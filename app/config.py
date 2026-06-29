from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    upstage_api_key: str = ""
    upload_dir: str = "uploads"
    database_url: str = ""
    blob_read_write_token: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
